"""Offline tests: every request is answered by an httpx.MockTransport."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Callable, List

import httpx
import pytest

import kotecharts
from kotecharts import (
    AsyncKoteCharts,
    AuthenticationError,
    KoteCharts,
    KoteChartsError,
    NotFoundError,
    RateLimitError,
)

KEY = "kote_" + "x" * 32
SERIES = {
    "chart": "mvrv-z-score",
    "granularity": "day",
    "series": [
        {"t": "2026-11-14", "mvrvZ": 1.1, "usd": 70000.0},
        {"t": "2026-11-15", "mvrvZ": 1.2, "usd": 71000.0},
        {"t": "2026-11-16", "mvrvZ": 1.3, "usd": 72000.0, "partial": True},
    ],
}


def ok(data: object) -> httpx.Response:
    return httpx.Response(200, json={"success": True, "data": data})


def client(handler: Callable[[httpx.Request], httpx.Response], **kw) -> KoteCharts:  # type: ignore[no-untyped-def]
    return KoteCharts(api_key=kw.pop("api_key", KEY), http_client=httpx.Client(transport=httpx.MockTransport(handler)), **kw)


def test_metric_is_keyless_and_unwraps_the_envelope() -> None:
    seen: List[httpx.Request] = []

    def handler(req: httpx.Request) -> httpx.Response:
        seen.append(req)
        return ok({"id": "sopr", "formula": "SOPR = …", "fields": [{"key": "sopr", "unit": "ratio"}]})

    kc = client(handler, api_key="")
    out = kc.metric("sopr")
    assert out["formula"] == "SOPR = …"
    assert seen[0].url.path == "/api/v1/metrics/sopr"
    assert "authorization" not in {k.lower() for k in seen[0].headers}
    assert seen[0].headers["user-agent"].startswith("kotecharts-python/")


def test_chart_sends_bearer_key_and_query_params() -> None:
    seen: List[httpx.Request] = []

    def handler(req: httpx.Request) -> httpx.Response:
        seen.append(req)
        return ok(SERIES)

    data = client(handler).chart(
        "mvrv-z-score",
        start="2026-01-01",
        end=datetime(2026, 11, 16, 12, 0, tzinfo=timezone.utc),
        granularity="week",
        include_partial=True,
    )
    req = seen[0]
    assert req.headers["authorization"] == f"Bearer {KEY}"
    assert req.url.path == "/api/v1/public/charts/mvrv-z-score"
    assert dict(req.url.params) == {
        "from": "2026-01-01",
        "to": "2026-11-16T12:00:00Z",
        "granularity": "week",
        "includePartial": "true",
    }
    assert data.id == "mvrv-z-score"
    assert data.fields == ["mvrvZ", "usd"]
    # latest skips the still-open partial day
    assert data.latest == {"t": "2026-11-15", "mvrvZ": 1.2, "usd": 71000.0}


def test_keyed_call_without_a_key_fails_before_any_request(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("KOTE_API_KEY", raising=False)

    def handler(req: httpx.Request) -> httpx.Response:  # pragma: no cover - must not be called
        raise AssertionError("no request expected")

    with pytest.raises(KoteChartsError, match="free API key"):
        client(handler, api_key=None).charts()


def test_reads_the_key_from_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("KOTE_API_KEY", KEY)
    kc = KoteCharts(http_client=httpx.Client(transport=httpx.MockTransport(lambda r: ok({}))))
    assert kc.api_key == KEY


@pytest.mark.parametrize(
    "status,code,exc",
    [(401, "UNAUTHORIZED", AuthenticationError), (404, "NOT_FOUND", NotFoundError)],
)
def test_maps_error_envelopes_to_typed_errors(status: int, code: str, exc: type) -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status, json={"success": False, "error": {"code": code, "message": "nope", "requestId": "r1"}}
        )

    with pytest.raises(exc) as info:
        client(handler).chart("x")
    assert info.value.status == status
    assert info.value.code == code
    assert info.value.request_id == "r1"


def test_retries_429_honouring_retry_after(monkeypatch: pytest.MonkeyPatch) -> None:
    sleeps: List[float] = []
    monkeypatch.setattr(kotecharts._client.time, "sleep", lambda s: sleeps.append(s))
    calls = {"n": 0}

    def handler(req: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(
                429,
                headers={"Retry-After": "1"},
                json={"success": False, "error": {"code": "RATE_LIMIT", "message": "slow down"}},
            )
        return ok(SERIES)

    assert client(handler).chart("mvrv-z-score").id == "mvrv-z-score"
    assert calls["n"] == 2
    assert sleeps == [1.0]


def test_gives_up_after_max_retries_with_retry_after(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(kotecharts._client.time, "sleep", lambda s: None)

    def handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(
            429,
            headers={"Retry-After": "2"},
            json={"success": False, "error": {"code": "RATE_LIMIT", "message": "slow down"}},
        )

    with pytest.raises(RateLimitError) as info:
        client(handler, max_retries=1).usage()
    assert info.value.retry_after == 2.0


def test_to_pandas_indexes_by_utc_time() -> None:
    pd = pytest.importorskip("pandas")
    data = client(lambda r: ok(SERIES)).chart("mvrv-z-score")
    frame = data.to_pandas()
    assert list(frame.columns)[:2] == ["mvrvZ", "usd"]
    assert isinstance(frame.index, pd.DatetimeIndex)
    assert str(frame.index.tz) == "UTC"


def test_async_client_mirrors_the_sync_api() -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        if req.url.path.startswith("/api/v1/metrics"):
            return ok({"total": 1, "metrics": [{"id": "nupl"}]})
        return ok(SERIES)

    async def run() -> None:
        async with AsyncKoteCharts(
            api_key=KEY, http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
        ) as kc:
            assert (await kc.metrics())["total"] == 1
            assert (await kc.latest("mvrv-z-score"))["t"] == "2026-11-15"

    asyncio.run(run())


def test_base_url_override_and_trailing_slash() -> None:
    seen: List[str] = []

    def handler(req: httpx.Request) -> httpx.Response:
        seen.append(str(req.url))
        return ok({})

    client(handler, base_url="http://127.0.0.1:3350/").metrics()
    assert seen == ["http://127.0.0.1:3350/api/v1/metrics"]


def test_version_is_exposed() -> None:
    assert json.loads(json.dumps(kotecharts.__version__)) == "0.1.0"

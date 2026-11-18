"""Synchronous and asynchronous clients for the Kote Charts public API."""

from __future__ import annotations

import asyncio
import os
import random
import time
from datetime import date, datetime, timezone
from typing import Any, Dict, Mapping, Optional, Union

import httpx

from ._errors import APIConnectionError, KoteChartsError, RateLimitError, error_for_status
from ._models import ChartData
from ._version import __version__

DEFAULT_BASE_URL = "https://kotecharts.com"
DEFAULT_TIMEOUT = 30.0
DEFAULT_MAX_RETRIES = 3
_RETRY_STATUSES = {429, 502, 503, 504}

DateLike = Union[str, date, datetime]


def _fmt_date(value: Optional[DateLike]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        # Naive datetimes are taken as UTC; aware ones are converted to UTC.
        utc = value if value.tzinfo is None else value.astimezone(timezone.utc)
        return utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def _chart_params(
    start: Optional[DateLike],
    end: Optional[DateLike],
    granularity: Optional[str],
    exchange: Optional[str],
    include_partial: bool,
) -> Dict[str, str]:
    params: Dict[str, str] = {}
    if start is not None:
        params["from"] = _fmt_date(start) or ""
    if end is not None:
        params["to"] = _fmt_date(end) or ""
    if granularity is not None:
        params["granularity"] = granularity
    if exchange is not None:
        params["exchange"] = exchange
    if include_partial:
        params["includePartial"] = "true"
    return params


def _raise_for(response: httpx.Response) -> None:
    if response.is_success:
        return
    code = message = request_id = None
    try:
        body = response.json()
        err = body.get("error") if isinstance(body, dict) else None
        if isinstance(err, dict):
            code = err.get("code")
            message = err.get("message")
            request_id = err.get("requestId")
    except ValueError:
        pass
    message = message or f"HTTP {response.status_code}"
    cls = error_for_status(response.status_code)
    if cls is RateLimitError:
        raise RateLimitError(
            message,
            retry_after=_retry_after(response),
            status=response.status_code,
            code=code,
            request_id=request_id,
        )
    raise cls(message, status=response.status_code, code=code, request_id=request_id)


def _retry_after(response: httpx.Response) -> Optional[float]:
    raw = response.headers.get("Retry-After")
    try:
        return float(raw) if raw is not None else None
    except ValueError:
        return None


def _backoff(attempt: int, response: Optional[httpx.Response]) -> float:
    if response is not None:
        hinted = _retry_after(response)
        if hinted is not None:
            return min(max(hinted, 0.0), 30.0)
    return min(0.5 * (2**attempt), 8.0) + random.uniform(0, 0.25)


def _unwrap(response: httpx.Response) -> Any:
    _raise_for(response)
    body = response.json()
    if isinstance(body, dict) and "success" in body and "data" in body:
        return body["data"]
    return body


class _Base:
    def __init__(
        self,
        api_key: Optional[str],
        base_url: Optional[str],
        max_retries: int,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.environ.get("KOTE_API_KEY")
        self.base_url = (base_url or os.environ.get("KOTE_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.max_retries = max_retries

    def _headers(self, keyed: bool) -> Dict[str, str]:
        headers = {"Accept": "application/json", "User-Agent": f"kotecharts-python/{__version__}"}
        if keyed:
            if not self.api_key:
                raise KoteChartsError(
                    "This endpoint needs an API key: pass api_key=... or set KOTE_API_KEY "
                    "(create one at https://kotecharts.com/account).",
                    status=401,
                    code="UNAUTHORIZED",
                )
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers


class KoteCharts(_Base):
    """Client for the Kote Charts public API.

    >>> from kotecharts import KoteCharts
    >>> kc = KoteCharts()                     # reads KOTE_API_KEY
    >>> kc.metric("mvrv-z-score")["formula"]  # no key needed
    >>> kc.chart("mvrv-z-score", start="2024-01-01", granularity="week").to_pandas()

    Data licence: non-commercial use only, with attribution — cite "Kote Charts"
    and link https://kotecharts.com/c/{id}; commercial use requires prior written
    permission (https://kotecharts.com/license). Educational only — not financial advice.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        *,
        base_url: Optional[str] = None,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        super().__init__(api_key, base_url, max_retries)
        self._http = http_client or httpx.Client(timeout=timeout)
        self._owns_http = http_client is None

    # -- lifecycle --------------------------------------------------------
    def close(self) -> None:
        if self._owns_http:
            self._http.close()

    def __enter__(self) -> "KoteCharts":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # -- transport --------------------------------------------------------
    def _get(self, path: str, *, keyed: bool, params: Optional[Mapping[str, str]] = None) -> Any:
        url = f"{self.base_url}{path}"
        headers = self._headers(keyed)
        attempt = 0
        while True:
            response: Optional[httpx.Response] = None
            try:
                response = self._http.get(url, headers=headers, params=params)
            except httpx.TransportError as exc:
                if attempt >= self.max_retries:
                    raise APIConnectionError(f"could not reach {self.base_url}: {exc}") from exc
            if response is not None and (
                response.status_code not in _RETRY_STATUSES or attempt >= self.max_retries
            ):
                return _unwrap(response)
            time.sleep(_backoff(attempt, response))
            attempt += 1

    # -- keyless ----------------------------------------------------------
    def metrics(self) -> Dict[str, Any]:
        """Machine-readable methodology for every public chart (no key needed)."""
        return self._get("/api/v1/metrics", keyed=False)

    def metric(self, chart_id: str) -> Dict[str, Any]:
        """Methodology of one chart: formula, fields with units, sources, limitations, freshness."""
        return self._get(f"/api/v1/metrics/{chart_id}", keyed=False)

    # -- keyed ------------------------------------------------------------
    def charts(self) -> Dict[str, Any]:
        """Catalog: data window, every published chart id with freshness, your rate limit."""
        return self._get("/api/v1/public/charts", keyed=True)

    def chart(
        self,
        chart_id: str,
        *,
        start: Optional[DateLike] = None,
        end: Optional[DateLike] = None,
        granularity: Optional[str] = None,
        exchange: Optional[str] = None,
        include_partial: bool = False,
    ) -> ChartData:
        """Full-resolution data of one chart (``granularity``: 5m, day, 3day, week, month, year)."""
        payload = self._get(
            f"/api/v1/public/charts/{chart_id}",
            keyed=True,
            params=_chart_params(start, end, granularity, exchange, include_partial),
        )
        return ChartData.from_payload(chart_id, payload)

    def latest(self, chart_id: str) -> Optional[Dict[str, Any]]:
        """The newest closed data row of a time-series chart (``None`` for snapshots)."""
        return self.chart(chart_id).latest

    def usage(self) -> Dict[str, Any]:
        """Your rate limit and today's ok / rate-limited request counters."""
        return self._get("/api/v1/public/usage", keyed=True)


class AsyncKoteCharts(_Base):
    """``asyncio`` twin of :class:`KoteCharts` (same methods, awaitable)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        *,
        base_url: Optional[str] = None,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        super().__init__(api_key, base_url, max_retries)
        self._http = http_client or httpx.AsyncClient(timeout=timeout)
        self._owns_http = http_client is None

    async def aclose(self) -> None:
        if self._owns_http:
            await self._http.aclose()

    async def __aenter__(self) -> "AsyncKoteCharts":
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.aclose()

    async def _get(self, path: str, *, keyed: bool, params: Optional[Mapping[str, str]] = None) -> Any:
        url = f"{self.base_url}{path}"
        headers = self._headers(keyed)
        attempt = 0
        while True:
            response: Optional[httpx.Response] = None
            try:
                response = await self._http.get(url, headers=headers, params=params)
            except httpx.TransportError as exc:
                if attempt >= self.max_retries:
                    raise APIConnectionError(f"could not reach {self.base_url}: {exc}") from exc
            if response is not None and (
                response.status_code not in _RETRY_STATUSES or attempt >= self.max_retries
            ):
                return _unwrap(response)
            await asyncio.sleep(_backoff(attempt, response))
            attempt += 1

    async def metrics(self) -> Dict[str, Any]:
        return await self._get("/api/v1/metrics", keyed=False)

    async def metric(self, chart_id: str) -> Dict[str, Any]:
        return await self._get(f"/api/v1/metrics/{chart_id}", keyed=False)

    async def charts(self) -> Dict[str, Any]:
        return await self._get("/api/v1/public/charts", keyed=True)

    async def chart(
        self,
        chart_id: str,
        *,
        start: Optional[DateLike] = None,
        end: Optional[DateLike] = None,
        granularity: Optional[str] = None,
        exchange: Optional[str] = None,
        include_partial: bool = False,
    ) -> ChartData:
        payload = await self._get(
            f"/api/v1/public/charts/{chart_id}",
            keyed=True,
            params=_chart_params(start, end, granularity, exchange, include_partial),
        )
        return ChartData.from_payload(chart_id, payload)

    async def latest(self, chart_id: str) -> Optional[Dict[str, Any]]:
        return (await self.chart(chart_id)).latest

    async def usage(self) -> Dict[str, Any]:
        return await self._get("/api/v1/public/usage", keyed=True)

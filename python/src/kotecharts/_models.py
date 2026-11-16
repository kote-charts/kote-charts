"""Light result wrappers. Every object keeps the raw JSON in ``.raw``."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ChartData:
    """One chart payload from ``GET /api/v1/public/charts/{id}``.

    ``series`` is a list of rows ``{"t": "2024-01-01", <field>: <number|None>, ...}``.
    Field names and units are documented per chart by :meth:`KoteCharts.metric`.
    """

    id: str
    granularity: Optional[str]
    series: List[Dict[str, Any]]
    raw: Dict[str, Any] = field(repr=False)

    @property
    def fields(self) -> List[str]:
        """Numeric field names present in the series (``t`` excluded)."""
        seen: Dict[str, None] = {}
        for row in self.series[-200:]:
            for key, value in row.items():
                if key not in ("t", "partial") and (isinstance(value, (int, float)) or value is None):
                    seen.setdefault(key, None)
        return list(seen)

    @property
    def latest(self) -> Optional[Dict[str, Any]]:
        """The newest closed row, or ``None`` for non-series charts."""
        closed = [r for r in self.series if not r.get("partial")]
        return closed[-1] if closed else None

    def to_pandas(self):  # type: ignore[no-untyped-def]
        """Series as a ``pandas.DataFrame`` indexed by UTC timestamp.

        Requires the optional extra: ``pip install "kotecharts[pandas]"``.
        """
        try:
            import pandas as pd
        except ImportError as exc:  # pragma: no cover - depends on the extra
            raise ImportError('to_pandas() needs pandas: pip install "kotecharts[pandas]"') from exc
        frame = pd.DataFrame(self.series)
        if frame.empty:
            return frame
        frame["t"] = pd.to_datetime(frame["t"], utc=True)
        return frame.set_index("t").sort_index()

    @classmethod
    def from_payload(cls, chart_id: str, payload: Dict[str, Any]) -> "ChartData":
        series = payload.get("series")
        return cls(
            id=str(payload.get("chart") or chart_id),
            granularity=payload.get("granularity"),
            series=list(series) if isinstance(series, list) else [],
            raw=payload,
        )

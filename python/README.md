# kotecharts — Python SDK

**Free Bitcoin On-Chain Analytics API & MCP Server** — 110+ charts, history since 2009:
MVRV, NUPL, SOPR, exchange flows and whale analytics, computed from our own Bitcoin full node.

```bash
pip install kotecharts            # add [pandas] for DataFrames
```

```python
from kotecharts import KoteCharts

kc = KoteCharts()                         # reads KOTE_API_KEY (free key: https://kotecharts.com/account)

kc.metric("mvrv-z-score")["formula"]      # methodology — no key needed
df = kc.chart("mvrv-z-score", start="2020-01-01", granularity="week").to_pandas()
kc.latest("exchange-netflow")             # newest closed day
```

- `metrics()` / `metric(id)` — machine-readable methodology (formula, fields + units, input
  categories, update cadence, limitations, freshness). **No key.**
- `charts()` — catalog of every public chart with freshness.
- `chart(id, start=, end=, granularity=, exchange=, include_partial=)` → `ChartData`
  (`.series`, `.fields`, `.latest`, `.to_pandas()`).
- `latest(id)`, `usage()`; `AsyncKoteCharts` has the same methods for `asyncio`.

Errors are typed (`AuthenticationError`, `NotFoundError`, `RateLimitError` with `.retry_after`, …);
429/503 are retried with backoff (honouring `Retry-After`). The limit is 3 requests per second per key.

Data is free for **non-commercial** use with attribution — cite "Kote Charts" and link
`https://kotecharts.com/c/{id}`. Educational only, not financial advice.
Full docs: <https://github.com/kote-charts/kote-charts>.

# kotecharts — Python SDK

**Bitcoin On-Chain Analytics API & MCP Server** — 110+ charts, history since 2009, new data every
block: MVRV, NUPL, SOPR, exchange flows and whale analytics, computed from our own Bitcoin full node.

```bash
pip install kotecharts            # add [pandas] for DataFrames
```

```python
from kotecharts import KoteCharts

kc = KoteCharts()                         # reads KOTE_API_KEY (key: https://kotecharts.com/account)

kc.metric("mvrv-z-score")["formula"]      # methodology — no key needed
df = kc.chart("mvrv-z-score", start="2020-01-01", granularity="week").to_pandas()
kc.latest("exchange-netflow")             # newest closed day
kc.chart("sopr", granularity="5m").latest # newest 5-minute bucket — follows every block
```

Flow and spending metrics (SOPR, realized profit/loss, coin days destroyed, exchange, miner, fund and
whale flows) are republished after **every Bitcoin block**, typically within a couple of minutes, as
5-minute buckets for the last 30 days (`granularity="5m"`). Network-activity charts refresh every
30 minutes; daily values are closed UTC days. Each response carries `asOf` and the block `watermark`.

- `metrics()` / `metric(id)` — machine-readable methodology (formula, fields + units, input
  categories, update cadence, limitations, freshness). **No key.**
- `charts()` — catalog of every public chart with freshness.
- `chart(id, start=, end=, granularity=, exchange=, include_partial=)` → `ChartData`
  (`.series`, `.fields`, `.latest`, `.to_pandas()`).
- `latest(id)`, `usage()`; `AsyncKoteCharts` has the same methods for `asyncio`.

Errors are typed (`AuthenticationError`, `NotFoundError`, `RateLimitError`, `ServiceUnavailableError`, …)
and carry `.status`, `.code`, `.request_id` and `.retry_after`. 429/503 are retried with backoff,
honouring `Retry-After`; a requested wait longer than 30 s is raised at once instead of slept through.
The limit is 3 requests per second per key.

Data: **non-commercial use only, with attribution** — cite "Kote Charts" and link `https://kotecharts.com/c/{id}`; commercial use requires prior written permission ([data licence](https://kotecharts.com/license)). Educational only, not financial advice.
Full docs: <https://github.com/kote-charts/kote-charts>.

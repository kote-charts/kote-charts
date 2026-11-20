# kotecharts — TypeScript / JavaScript SDK

**Bitcoin On-Chain Analytics API & MCP Server** — 110+ charts, history since 2009, new data every
block: MVRV, NUPL, SOPR, exchange flows and whale analytics, computed from our own Bitcoin full node.

```bash
npm i kotecharts
```

```ts
import { KoteCharts } from 'kotecharts';

const kc = new KoteCharts(); // reads KOTE_API_KEY — key: https://kotecharts.com/account

const meta = await kc.metric('mvrv-z-score');         // methodology — no key needed
const data = await kc.chart('mvrv-z-score', { from: '2020-01-01', granularity: 'week' });
const latest = await kc.latest('exchange-netflow');    // newest closed day
const live = await kc.chart('sopr', { granularity: '5m' }); // 5-minute buckets, follow every block
```

Flow and spending metrics (SOPR, realized profit/loss, coin days destroyed, exchange, miner, fund and
whale flows) are republished after **every Bitcoin block**, typically within a couple of minutes, as
5-minute buckets for the last 30 days (`granularity: '5m'`). Network-activity charts refresh every
30 minutes; daily values are closed UTC days. Each response carries `asOf` and the block `watermark`.

- Zero dependencies, native `fetch` (Node 18+, browsers, Deno, Bun); ESM + CommonJS; types
  generated from the public OpenAPI document.
- `metrics()` / `metric(id)` (no key), `charts()`, `chart(id, query)`, `latest(id)`, `usage()`.
- Retries 429/5xx honouring `Retry-After` (a requested wait longer than 30 s is thrown at once
  instead of slept through); errors are `KoteChartsError` with `status`, `code`, `requestId`,
  `retryAfter`. Limit: 3 requests per second per key.

Data: **non-commercial use only, with attribution** — cite "Kote Charts" and link `https://kotecharts.com/c/{id}`; commercial use requires prior written permission ([data licence](https://kotecharts.com/license)). Not financial advice. Docs: <https://github.com/kote-charts/kote-charts>.

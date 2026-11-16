# Kote Charts — Free Bitcoin On-Chain Analytics API & MCP Server

**110+ charts, history since 2009: MVRV, NUPL, SOPR, exchange flows and whale analytics** —
computed from our own Bitcoin full node, free, with a public REST API, a keyless MCP server for
AI agents, and machine-readable methodology for every metric.

[Website](https://kotecharts.com) · [Charts](https://kotecharts.com/charts) ·
[API docs](https://kotecharts.com/docs) · [MCP](https://kotecharts.com/mcp) ·
[Methodology](https://kotecharts.com/methodology) · [OpenAPI](https://kotecharts.com/api/v1/openapi.json) ·
[llms.txt](https://kotecharts.com/llms.txt)

| | |
|---|---|
| **MCP server** | `https://kotecharts.com/api/v1/mcp` — Streamable HTTP, **no key** (60 req/min per IP; a free key gives 3 req/s) |
| **REST API** | `https://kotecharts.com/api/v1/public/charts/{id}` — free key, 3 req/s |
| **Metric catalog** | `https://kotecharts.com/api/v1/metrics` — formula, fields + units, input categories, cadence, limitations, freshness — **no key** |
| **Python** | `pip install kotecharts` → [python/](python/) |
| **TypeScript / JS** | `npm i kotecharts` → [typescript/](typescript/) |
| **stdio MCP** | `npx -y kotecharts-mcp` → [mcp-proxy/](mcp-proxy/) |

## 30-second start

**Give your AI agent Bitcoin on-chain data** (Claude Code):

```bash
claude mcp add --transport http kote-charts https://kotecharts.com/api/v1/mcp
```

Then ask: *"Where is Bitcoin in its cycle according to MVRV Z-Score and NUPL? Cite the charts."*
Other clients (Claude Desktop, ChatGPT, Cursor, VS Code, Windsurf, Gemini CLI, Codex) →
[integrations/](integrations/).

**Read the methodology of any metric — no key:**

```bash
curl -s https://kotecharts.com/api/v1/metrics/mvrv-z-score | jq '.data | {formula, fields, sources, limitations, lastT}'
```

**Pull data** with a free key from [kotecharts.com/account](https://kotecharts.com/account):

```bash
curl -H "Authorization: Bearer $KOTE_API_KEY" \
  "https://kotecharts.com/api/v1/public/charts/mvrv-z-score?from=2025-01-01&granularity=week"
```

```python
from kotecharts import KoteCharts

kc = KoteCharts()  # reads KOTE_API_KEY
df = kc.chart("mvrv-z-score", start="2020-01-01", granularity="week").to_pandas()
```

```ts
import { KoteCharts } from 'kotecharts';

const kc = new KoteCharts(); // reads KOTE_API_KEY
const nupl = await kc.latest('nupl');
```

## What's inside

| Category | Examples |
|---|---|
| Valuation | MVRV, MVRV Z-Score, NUPL, Puell Multiple, Mayer Multiple, stock-to-flow, power law |
| Realized metrics | SOPR, aSOPR, STH/LTH SOPR, realized cap & price, realized P&L |
| Coin age | HODL waves, coin days destroyed, dormancy, age-band realized cap |
| Exchange flows & whales | exchange netflow (per venue), reserves, whale ratio, whale accumulation, whale→exchange |
| Holders & supply | LTH/STH supply, supply in profit, balance cohorts |
| Network & fees | transactions, active addresses, fees, block interval, UTXO set |
| Cross-asset & ETFs | spot ETF flows, BTC vs gold / DXY / S&P 500, stablecoin supply ratio |

The full, always-current list: [`docs/metrics.md`](docs/metrics.md) (generated) or
`GET /api/v1/metrics`.

## Repository layout

| Path | What |
|---|---|
| [`docs/`](docs/) | MCP reference (tools, resources, prompts), REST API, metric catalog, methodology |
| [`integrations/`](integrations/) | Copy-paste setup for Claude, ChatGPT, Cursor, VS Code, Windsurf, Gemini CLI, Codex, agent frameworks |
| [`python/`](python/) | `kotecharts` on PyPI — sync + async client, pandas helper |
| [`typescript/`](typescript/) | `kotecharts` on npm — zero-dependency fetch client, types from OpenAPI |
| [`mcp-proxy/`](mcp-proxy/) | `kotecharts-mcp` on npm — stdio ↔ hosted MCP bridge |
| [`examples/`](examples/) | Python and TypeScript scripts, agent examples |
| [`skills/kote-charts/`](skills/kote-charts/) | Agent Skill: how an agent should use and cite the data |
| [`server.json`](server.json) | Official MCP Registry manifest (`com.kotecharts/charts`) |

## Data, license and attribution

- **Code** in this repository: [MIT](LICENSE).
- **Data** from kotecharts.com: free for personal, educational and other **non-commercial** use with
  attribution — see [DATA-LICENSE.md](DATA-LICENSE.md). Cite *"Kote Charts"* and link the chart page
  `https://kotecharts.com/c/{id}` (every API/MCP answer carries a ready `cite` string).
- Educational only — **not financial advice**. Metrics are descriptive, not forecasts; read each
  metric's `limitations`.

## How the data is made

Every on-chain metric is computed from a Bitcoin full node we operate ourselves (every block since
the 2009 genesis block) and a UTXO cost-basis index built from it; market inputs come from public
market data. Exchange and whale metrics rely on address labels and clustering, which are heuristic.
Details: [methodology](https://kotecharts.com/methodology) · machine-readable: `GET /api/v1/metrics`.

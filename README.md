# Kote Charts — Bitcoin On-Chain Analytics API & MCP Server

[![PyPI](https://img.shields.io/pypi/v/kotecharts?label=PyPI%20kotecharts)](https://pypi.org/project/kotecharts/)
[![npm](https://img.shields.io/npm/v/kotecharts?label=npm%20kotecharts)](https://www.npmjs.com/package/kotecharts)
[![npm MCP proxy](https://img.shields.io/npm/v/kotecharts-mcp?label=npm%20kotecharts-mcp)](https://www.npmjs.com/package/kotecharts-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-com.kotecharts%2Fcharts-blue)](https://registry.modelcontextprotocol.io/v0.1/servers?search=com.kotecharts/charts)
[![Kote Charts MCP connector](https://glama.ai/mcp/connectors/com.kotecharts/charts/badges/score.svg)](https://glama.ai/mcp/connectors/com.kotecharts/charts)
[![CI](https://github.com/kote-charts/kote-charts/actions/workflows/ci.yml/badge.svg)](https://github.com/kote-charts/kote-charts/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-green)](LICENSE)

**110+ charts, history since 2009: MVRV, NUPL, SOPR, exchange flows and whale analytics** —
computed from our own Bitcoin full node, with a public REST API, a keyless MCP server for
AI agents, and machine-readable methodology for every metric. No charge for non-commercial use
with attribution; commercial use needs a licence — see [Data, license and attribution](#data-license-and-attribution).

[Website](https://kotecharts.com) · [Charts](https://kotecharts.com/charts) ·
[API docs](https://kotecharts.com/docs) · [MCP](https://kotecharts.com/mcp) ·
[Methodology](https://kotecharts.com/methodology) · [OpenAPI](https://kotecharts.com/api/v1/openapi.json) ·
[llms.txt](https://kotecharts.com/llms.txt) · [Status](https://kotecharts.com/status) ·
[Changelog](https://kotecharts.com/changelog) · [Data licence](https://kotecharts.com/license)

| | |
|---|---|
| **MCP server** | `https://kotecharts.com/api/v1/mcp` — Streamable HTTP, **no key** (60 tool calls/min per IP; an API key gives 3 req/s) |
| **REST API** | `https://kotecharts.com/api/v1/public/charts/{id}` — API key, 3 req/s |
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

**Pull data** with an API key (no charge for non-commercial use) from [kotecharts.com/account](https://kotecharts.com/account):

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
- **Data** from kotecharts.com: personal, educational, research and other **non-commercial** use
  with **required attribution** — cite *"Kote Charts"* and link the chart page
  `https://kotecharts.com/c/{id}` (every API and MCP answer carries `pageUrl`, a ready `cite` string and
  the `license` URL). **Commercial use requires prior written permission** — see
  [DATA-LICENSE.md](DATA-LICENSE.md) and [kotecharts.com/license](https://kotecharts.com/license).
  The MIT licence above covers the code only, not the data.
- Educational only — **not financial advice**. Metrics are descriptive, not forecasts; read each
  metric's `limitations`.

## Verify independently

- **Contract tests** — [`contract/`](contract/) checks production against the published OpenAPI
  schemas, data freshness, the licence on every response and one public chart count across the site,
  the API and MCP. Keyless; runs daily in [CI](.github/workflows/contract.yml) and locally with
  `node --test contract/*.test.mjs` (Node ≥ 20, no dependencies; `KOTE_BASE_URL` to point elsewhere).
- **Service status** — [kotecharts.com/status](https://kotecharts.com/status) and
  `GET https://kotecharts.com/api/v1/status` (no key): components, analysed block, stale charts.
- **Change history** — [kotecharts.com/changelog](https://kotecharts.com/changelog) (API, MCP, data
  corrections, incidents; Atom feed) and this repo's [CHANGELOG.md](CHANGELOG.md) for SDK releases.

## How the data is made

Every on-chain metric is computed from a Bitcoin full node we operate ourselves (every block since
the 2009 genesis block) and a UTXO cost-basis index built from it; market inputs come from public
market data. Exchange and whale metrics rely on address labels and clustering, which are heuristic.
Details: [methodology](https://kotecharts.com/methodology) · machine-readable: `GET /api/v1/metrics`.

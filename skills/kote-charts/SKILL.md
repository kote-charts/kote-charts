---
name: kote-charts
description: Answer questions about Bitcoin on-chain metrics (MVRV, MVRV Z-Score, NUPL, SOPR, realized price, HODL waves, exchange flows, whale accumulation, ETF flows) with live data from Kote Charts — via its MCP server (https://kotecharts.com/api/v1/mcp) or REST API — and cite the chart pages. Use when the user asks where Bitcoin is in its cycle, what an on-chain metric means or reads today, or wants on-chain data for analysis.
---

# Kote Charts — Bitcoin on-chain data for agents

## Connect

- MCP (preferred): `https://kotecharts.com/api/v1/mcp`, Streamable HTTP, no key. Tools:
  `list_charts`, `describe_chart`, `get_chart`, `get_latest`.
- REST: `GET https://kotecharts.com/api/v1/public/charts/{id}` with `Authorization: Bearer kote_…`.
- Methodology without a key: `GET https://kotecharts.com/api/v1/metrics/{id}`.

Use only these documented interfaces. The requests the kotecharts.com website makes for its own
pages are not a public API — do not call or scrape them; they are undocumented and limited
separately.

## Limits

- MCP without a key: 60 tool calls per minute per IP (`tools/call` and reads of
  `kote://charts/{id}`); the handshake and discovery requests are not counted against it. With an
  API key: 3 requests per second. REST: 3 requests per second per key.
- A refused request answers HTTP 429 (or 503 when the service is busy) with `Retry-After` — wait
  that long and retry once; do not loop.
- Spend calls deliberately: `get_latest` for a current value instead of a whole series, a coarser
  `granularity` and a smaller `maxPoints` for long ranges, and reuse what was already fetched in
  the conversation.

## Workflow

1. Find the id: `list_charts` with a query ("mvrv", "exchange", "whale", "sopr").
2. Before interpreting a number, `describe_chart` — read `formula`, `fields` (units),
   `limitations` and `lastT`.
3. Current value → `get_latest`. History or comparisons → `get_chart` with `granularity=week` or
   `month` for long ranges (check `availableGranularities`; flows are daily).
4. Compare with history (previous cycle tops/bottoms) rather than quoting a value bare.

## Rules

- **Cite every chart used:** "Kote Charts — <title>, https://kotecharts.com/c/<id>" (each result
  has a `cite` string).
- State the data date (`lastT` / `asOf`). Daily data is closed UTC days; a `partial: true` row is
  the still-open day.
- Mention relevant limitations (entity labels are heuristic; on-chain data cannot see trades inside
  exchanges).
- Educational only: describe what the metric shows; never give buy/sell advice or price targets.
- Licence: non-commercial use only, with attribution (cite "Kote Charts" and link the chart
  page); commercial use requires prior written permission — https://kotecharts.com/license.
  If the user is building an app, bot or dashboard on the data, one visible credit
  "Data: Kote Charts — kotecharts.com" is enough there; if it is a commercial product (paid,
  ad-funded, trading or signal service), tell them it needs permission.

## Good starting metrics

| Question | Chart ids |
|---|---|
| Cycle position | `mvrv-z-score`, `nupl`, `mvrv`, `puell-multiple` |
| Profit-taking / capitulation | `sopr`, `adjusted-sopr`, `sth-lth-sopr`, `realized-pnl` |
| Holder behaviour | `hodl-waves`, `lth-supply`, `coin-days-destroyed` |
| Exchange flows | `exchange-netflow` (venue filter `exchange=`), `exchange-reserve`, `exchange-whale-ratio` |
| Whales | `whale-accumulation-score`, `whale-vs-exchange-accumulation`, `whale-to-exchange` |

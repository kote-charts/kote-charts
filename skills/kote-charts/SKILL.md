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
  If the user is building a commercial product on the data, tell them so.

## Good starting metrics

| Question | Chart ids |
|---|---|
| Cycle position | `mvrv-z-score`, `nupl`, `mvrv`, `puell-multiple` |
| Profit-taking / capitulation | `sopr`, `adjusted-sopr`, `sth-lth-sopr`, `realized-pnl` |
| Holder behaviour | `hodl-waves`, `lth-supply`, `coin-days-destroyed` |
| Exchange flows | `exchange-netflow` (venue filter `exchange=`), `exchange-reserve`, `exchange-whale-ratio` |
| Whales | `whale-accumulation-score`, `whale-vs-exchange-accumulation`, `whale-to-exchange` |

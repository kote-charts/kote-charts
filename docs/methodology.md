# Methodology (summary)

The authoritative, always-current version is https://kotecharts.com/methodology; the
machine-readable version is `GET https://kotecharts.com/api/v1/metrics` (per metric: formula,
fields and units, input categories, update cadence, limitations, freshness).

- **Source:** every on-chain metric is computed from a Bitcoin full node we operate ourselves —
  every block since the genesis block of 3 January 2009 — indexed into transactions, inputs,
  outputs and addresses. Market inputs (BTC/USD, traditional markets, stablecoin supply, ETF data,
  a sentiment index) come from public market data and refresh daily.
- **UTXO cost basis:** a live index of every unspent output with its creation day, creation price
  and age. Realized cap/price, MVRV, MVRV Z-Score, NUPL, SOPR and all age bands derive from it, so
  they are internally consistent.
- **Entities:** addresses are grouped with common-input-ownership clustering and labelled (exchanges,
  miners, funds) from third-party and manually verified labels. Labels are heuristic; exchange and
  whale series are restated from genesis when the label snapshot changes.
- **Cadence:** processing follows the chain block by block. Flow and spending metrics (SOPR,
  adjusted SOPR, realized profit/loss, coin days destroyed, spent and transfer volume, issuance,
  exchange / miner / fund / whale flows) are republished after every Bitcoin block — typically
  within a couple of minutes — as 5-minute buckets for the last 30 days. Network-activity charts
  refresh every 30 minutes; daily values are finalised after the UTC day closes; market inputs
  refresh once a day. Every metric reports `lastT`, `publishedAt` and the analysed block height;
  a chart response carries `asOf` and `watermark` (the block it reflects).
- **Intervals:** closed-only. `includePartial=true` (daily) appends the open UTC day, flagged
  `partial: true`; never sum it with closed days.
- **Limitations:** on-chain data does not see trades inside exchanges; 2009–2010 prices are sparse;
  models are descriptive, not forecasts. Not financial advice.

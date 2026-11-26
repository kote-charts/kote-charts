# Kote Charts in Google Sheets

Bitcoin on-chain metrics as spreadsheet functions — MVRV Z-Score, NUPL, SOPR, exchange flows,
whales and every other public chart — through a small Apps Script ([KoteCharts.gs](KoteCharts.gs)).

```
=KOTE_LATEST("mvrv-z-score")                                  latest row: header + values
=KOTE_LATEST("mvrv-z-score", "mvrvZ")                         one number
=KOTE_SERIES("mvrv-z-score", "mvrvZ", "2024-01-01", "week")   two columns: date, value
=KOTE_SERIES("exchange-netflow", "exNetBtc", A1)              start date from a cell
=KOTE_CHARTS()                                                every public chart (no key)
=KOTE_CREDIT()                                                "Data: Kote Charts — kotecharts.com"
```

Some spreadsheet locales separate arguments with `;` instead of `,`.

## Install (two minutes)

1. Create an API key at [kotecharts.com/account](https://kotecharts.com/account) — no charge for
   non-commercial use.
2. In your spreadsheet: **Extensions → Apps Script**, replace the editor contents with
   [KoteCharts.gs](KoteCharts.gs), click **Save**.
3. Reload the spreadsheet. A **Kote Charts** menu appears → **Set API key** → paste the key.
   Google asks once to authorize the script (it only fetches `kotecharts.com` and stores your key).
4. Type a formula, e.g. `=KOTE_LATEST("nupl", "nupl")`.

Chart ids and field names: every chart page on [kotecharts.com](https://kotecharts.com/charts) has a
**Use this data in code** block with the Sheets formula for that chart, and `=KOTE_CHARTS()` lists
them all (from the keyless [metric catalog](https://kotecharts.com/api/v1/metrics)).

## How it behaves

- **Your key stays out of the sheet.** It lives in your Apps Script user properties. In a shared
  spreadsheet, Google runs custom functions with the spreadsheet **owner's** properties, so
  collaborators' formulas use the owner's key.
- **Rate limit: 3 requests per second per key.** Responses are cached for 10 minutes
  (`CacheService`), so a sheet full of formulas makes one request per distinct chart and range; a
  `429` is retried after `Retry-After`. **Kote Charts → Clear cached data** forces fresh data.
- **Time series only in cells.** Snapshot and distribution charts (for example `overview` or
  HODL-wave bands) return an error — use the REST API or the [Python SDK](../../python/) for those.
- **Dates are real dates** (UTC), so you can chart a `KOTE_SERIES` range directly.
- **Freshness**: each chart updates per block, every 30 minutes or daily — `=KOTE_CHARTS()` shows the
  `updateCadence` of each one.

### Why not `IMPORTDATA`?

`IMPORTDATA` / `IMPORTJSON` can't send request headers, and the REST API takes the key only as a
header (`X-API-Key` or `Authorization: Bearer`) — never in the URL, where it would leak into logs
and shared links. The script sends it as a header.

## Licence and attribution

The data is licensed for **non-commercial use with attribution**. A sheet that other people see
needs one visible credit — put `=KOTE_CREDIT()` (*Data: Kote Charts — kotecharts.com*) next to the
data. A private sheet only you use needs none. Commercial use requires prior written permission —
see the [data licence](https://kotecharts.com/license). Educational only, never financial advice.

The script itself is MIT-licensed like the rest of this repository.

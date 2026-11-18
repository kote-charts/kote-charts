# Data license

The **code** in this repository is MIT-licensed (see [LICENSE](LICENSE)). That licence covers the
code only. The **data** served by https://kotecharts.com — the website, the REST API, the MCP server
and the metric catalog — is governed by section 12 of the
[Kote Charts Terms of Use](https://kotecharts.com/terms#data-licence); plain-language summary:
[kotecharts.com/license](https://kotecharts.com/license). In short:

- **Non-commercial use at no charge** — personal, educational, research and other non-commercial
  purposes.
- **Attribution is required** — cite "Kote Charts" and link the chart page, e.g.
  `Kote Charts — "MVRV Z-Score", https://kotecharts.com/c/mvrv-z-score`. Every API and MCP response
  carries `pageUrl`, a ready-made `cite` string and the `license` URL, plus the HTTP header
  `Link: <https://kotecharts.com/license>; rel="license"`.
- **Commercial use requires prior written permission** — for example use in or for a product or
  service that is sold or funded by subscriptions or advertising, paid research or newsletters built
  on the data, trading or investment services, or redistributing / reselling the data. Request it at
  https://kotecharts.com/contact?topic=licensing. Some inputs are themselves licensed for
  non-commercial use only, so a commercial permission may not cover every chart.
- **Quoting is fine:** individual figures or a single chart with attribution may appear in articles,
  posts, reports and videos — monetised ones included — as long as the data itself is not the product.
- **The official embeddable widget**, unmodified and with its built-in attribution, may be shown on
  any website, including commercial ones.
- **No warranty.** Metrics are heuristic estimates (entity labels in particular); read each
  metric's `limitations` (`GET /api/v1/metrics/{id}`) before drawing conclusions.
- **Not financial advice.**
- Rate limits: 3 requests/second per API key; 60 tool calls/minute per IP on the keyless MCP
  endpoint. Please cache what you fetch.
- Programmatic access goes through the documented interfaces — the REST API
  (`/api/v1/public/*`), the MCP server and the metric catalog (`/api/v1/metrics`). The requests the
  website makes for its own pages are not a public API: they are undocumented, may change without
  notice and are limited separately.

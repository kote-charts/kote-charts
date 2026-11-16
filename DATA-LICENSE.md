# Data license

The **code** in this repository is MIT-licensed (see [LICENSE](LICENSE)). The **data** served by
https://kotecharts.com — the website, the REST API, the MCP server and the metric catalog — is
governed by the [Kote Charts Terms of Use](https://kotecharts.com/terms). In short:

- **Free** for personal, educational, research and other **non-commercial** purposes.
- **Attribution:** cite "Kote Charts" and link the chart page, e.g.
  `Kote Charts — "MVRV Z-Score", https://kotecharts.com/c/mvrv-z-score`.
  Every API and MCP response includes a ready-made `cite` string.
- **No warranty.** Metrics are heuristic estimates (entity labels in particular); read each
  metric's `limitations` (`GET /api/v1/metrics/{id}`) before drawing conclusions.
- **Not financial advice.**
- Rate limits: 3 requests/second per free API key; 60 requests/minute per IP on the keyless MCP
  endpoint. Please cache what you fetch.

For anything beyond this (commercial redistribution, higher limits), use the contact form at
https://kotecharts.com/contact.

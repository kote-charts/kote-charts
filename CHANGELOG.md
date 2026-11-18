# Changelog

SDK, MCP-bridge and registry releases. Every public change to the service itself — API, MCP server,
data corrections, methodology, incidents — is listed at https://kotecharts.com/changelog
(Atom: https://kotecharts.com/changelog/feed.xml).

## 2026-11-18

- **Data licence made explicit** (Terms of Use §12, https://kotecharts.com/license): non-commercial use
  only, attribution **required**, commercial use by prior written permission; the official widget may
  be embedded anywhere. [DATA-LICENSE.md](DATA-LICENSE.md), READMEs, docstrings and package
  descriptions no longer call the data "free" without that qualification.
- Hosted API 1.2.0: keyless `GET /api/v1/health` and `GET /api/v1/status`; `license` / `attribution`
  on the chart catalog and `pageUrl` / `cite` / `license` on chart payloads (additive); every public
  response carries `Link: <https://kotecharts.com/license>; rel="license"`.
- Hosted MCP server 1.2.0: `license` on `list_charts`, `get_chart`, `get_latest`; instructions state the
  licence. MCP Registry `com.kotecharts/charts` 1.2.0 (description without "Free").
- `kotecharts` 0.2.0 (Python, npm): types regenerated from the 1.2.0 OpenAPI document (new status /
  health schemas and licence fields), clearer "needs an API key" errors.
- `kotecharts-mcp` 0.1.2: package description only (the registry pin stays at 0.1.0).
- New: [`contract/`](contract/) — keyless public contract tests (OpenAPI schemas vs live responses,
  freshness, licence, one public chart count across site / API / MCP), run daily in
  [`contract.yml`](.github/workflows/contract.yml) and locally with `node --test contract/*.test.mjs`.

## 2026-11-17

- `kotecharts` 0.1.1 and `kotecharts-mcp` 0.1.1 (npm): the bundled LICENSE is now the canonical MIT
  text (the code/data note lives in the README and DATA-LICENSE.md). First releases published from
  GitHub Actions via npm Trusted Publishing, with provenance.

## 2026-11-16

- First public release of the Kote Charts developer kit.
- `kotecharts` 0.1.0 (Python): sync + async client, typed errors, retries honouring `Retry-After`,
  `ChartData.to_pandas()`.
- `kotecharts` 0.1.0 (npm): zero-dependency fetch client, types generated from the public OpenAPI.
- `kotecharts-mcp` 0.1.0 (npm): stdio bridge to the hosted MCP server.
- Hosted MCP server 1.1.0: `list_charts`, `describe_chart`, `get_chart`, `get_latest`; resources
  `kote://charts/{id}`, `kote://catalog`, `kote://methodology`; prompts `explain_metric`,
  `cycle_position_brief`.
- Machine-readable methodology: `GET /api/v1/metrics` (no key).
- Official MCP Registry: `com.kotecharts/charts` 1.1.0 (remote) and 1.1.1 (+ repository) published;
  1.1.2 adds the `kotecharts-mcp` npm package once it is on npm.

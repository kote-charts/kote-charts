# Changelog

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

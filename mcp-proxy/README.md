# kotecharts-mcp — Bitcoin on-chain analytics MCP server (stdio)

A local stdio MCP server that forwards to the hosted **Kote Charts** MCP server
(`https://kotecharts.com/api/v1/mcp`): free Bitcoin on-chain analytics — MVRV, NUPL, SOPR,
exchange flows and whale analytics, history since 2009. For clients that only run local servers;
clients with remote-MCP support can use the URL directly.

```json
{
  "mcpServers": {
    "kote-charts": { "command": "npx", "args": ["-y", "kotecharts-mcp"] }
  }
}
```

- Tools: `list_charts`, `describe_chart`, `get_chart`, `get_latest`; resources
  `kote://charts/{id}`, `kote://catalog`, `kote://methodology`; prompts `explain_metric`,
  `cycle_position_brief` — whatever the hosted server advertises, so the proxy never goes stale.
- `KOTE_API_KEY` (optional, free at https://kotecharts.com/account): 3 requests/second instead of
  60/minute per IP. `KOTE_MCP_URL` overrides the endpoint.

Data is free for non-commercial use with attribution (cite "Kote Charts" and link
`https://kotecharts.com/c/{id}`). Not financial advice. Source:
<https://github.com/kote-charts/kote-charts>.

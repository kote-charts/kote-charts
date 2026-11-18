# Claude Code

```bash
claude mcp add --transport http kote-charts https://kotecharts.com/api/v1/mcp
```

With an API key (higher limit):

```bash
claude mcp add --transport http kote-charts https://kotecharts.com/api/v1/mcp \
  --header "Authorization: Bearer kote_your_key"
```

Check it with `/mcp` inside Claude Code, then ask e.g. *"Use kote-charts: what does exchange
netflow say about the last 30 days? Cite the chart."*

Project-scoped config (`.mcp.json` in the repo root):

```json
{
  "mcpServers": {
    "kote-charts": { "type": "http", "url": "https://kotecharts.com/api/v1/mcp" }
  }
}
```

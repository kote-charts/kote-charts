# Claude Desktop and claude.ai

**Remote connector (recommended):** Settings → Connectors → *Add custom connector* →
name `Kote Charts`, URL `https://kotecharts.com/api/v1/mcp`. No authentication is needed.

**Local stdio (older Desktop versions):** edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "kote-charts": {
      "command": "npx",
      "args": ["-y", "kotecharts-mcp"],
      "env": { "KOTE_API_KEY": "" }
    }
  }
}
```

Restart Claude Desktop. `KOTE_API_KEY` is optional.

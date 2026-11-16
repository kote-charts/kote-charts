# VS Code (GitHub Copilot agent mode)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "kote-charts": { "type": "http", "url": "https://kotecharts.com/api/v1/mcp" }
  }
}
```

Or run *MCP: Add Server…* from the command palette → HTTP → paste the URL. Select the tools in
Copilot Chat's agent mode tool picker.

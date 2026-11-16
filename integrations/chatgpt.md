# ChatGPT

In ChatGPT with **developer mode** enabled (Settings → Apps & Connectors → Advanced): *Create* a
connector → MCP server URL `https://kotecharts.com/api/v1/mcp`, authentication **No authentication**. Enable it in a chat from
the tools menu and ask, for example, *"Using Kote Charts, compare today's NUPL with the 2021 and
2024 peaks."*

Through the OpenAI API (Responses API remote MCP tool):

```json
{
  "type": "mcp",
  "server_label": "kote-charts",
  "server_url": "https://kotecharts.com/api/v1/mcp",
  "require_approval": "never"
}
```

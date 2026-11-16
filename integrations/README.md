# Integrations

One hosted MCP server — `https://kotecharts.com/api/v1/mcp` (Streamable HTTP, no key needed) —
plus a stdio bridge (`npx -y kotecharts-mcp`) for clients that only run local servers.

| Client / framework | Guide |
|---|---|
| Claude Code | [claude-code.md](claude-code.md) |
| Claude Desktop & claude.ai | [claude-desktop.md](claude-desktop.md) |
| Claude API (Messages API MCP connector) | [claude-api.md](claude-api.md) |
| ChatGPT (developer mode connectors) | [chatgpt.md](chatgpt.md) |
| Cursor | [cursor.md](cursor.md) |
| VS Code (GitHub Copilot agent mode) | [vscode.md](vscode.md) |
| Windsurf | [windsurf.md](windsurf.md) |
| Gemini CLI | [gemini-cli.md](gemini-cli.md) |
| OpenAI Codex CLI | [codex.md](codex.md) |
| OpenAI Agents SDK | [openai-agents-sdk.md](openai-agents-sdk.md) |
| LangChain / LangGraph | [langchain.md](langchain.md) |
| LlamaIndex | [llamaindex.md](llamaindex.md) |
| Vercel AI SDK | [vercel-ai-sdk.md](vercel-ai-sdk.md) |

**Limits:** 60 requests/minute per IP without a key. With a free key (`kote_…`, from
https://kotecharts.com/account) send `Authorization: Bearer kote_…` for 3 requests/second.

**What the agent gets:** tools `list_charts`, `describe_chart`, `get_chart`, `get_latest`;
resources `kote://charts/{id}`, `kote://catalog`, `kote://methodology`; prompts `explain_metric`,
`cycle_position_brief`. Full reference: [../docs/mcp.md](../docs/mcp.md).

**Attribution:** answers built on this data should cite "Kote Charts" and link
`https://kotecharts.com/c/{id}` — every tool result carries a `cite` string.

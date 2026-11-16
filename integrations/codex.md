# OpenAI Codex CLI

`~/.codex/config.toml` — stdio bridge (works with every Codex version):

```toml
[mcp_servers.kote-charts]
command = "npx"
args = ["-y", "kotecharts-mcp"]
# env = { KOTE_API_KEY = "kote_your_key" }   # optional
```

Codex versions with Streamable HTTP support can point at the hosted server directly:

```toml
[mcp_servers.kote-charts]
url = "https://kotecharts.com/api/v1/mcp"
```

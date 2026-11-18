# Examples

| Example | Needs |
|---|---|
| [python/metric_catalog.py](python/metric_catalog.py) — list every metric with its formula and units | nothing (keyless) |
| [python/mvrv_cycles.py](python/mvrv_cycles.py) — MVRV Z-Score peaks and troughs per cycle | API key, `kotecharts[pandas]` |
| [python/exchange_netflow.py](python/exchange_netflow.py) — weekly exchange netflow, per venue | API key, `kotecharts[pandas]` |
| [python/whale_accumulation.py](python/whale_accumulation.py) — whale cohorts vs exchange wallets | API key |
| [python/claude_api_agent.py](python/claude_api_agent.py) — Claude answers with Kote Charts via the MCP connector | Anthropic API key |
| [typescript/latest-values.ts](typescript/latest-values.ts) — today's MVRV Z, NUPL, SOPR, netflow | API key |
| [typescript/claude-api-mcp.ts](typescript/claude-api-mcp.ts) — Claude + MCP connector | Anthropic API key |

Agent-framework snippets (OpenAI Agents SDK, LangChain, LlamaIndex, Vercel AI SDK) live in
[../integrations/](../integrations/).

```bash
export KOTE_API_KEY=kote_your_key          # https://kotecharts.com/account
pip install "kotecharts[pandas]" && python python/mvrv_cycles.py
npx tsx typescript/latest-values.ts         # after: npm i kotecharts
```

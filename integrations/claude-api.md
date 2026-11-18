# Claude API (Messages API MCP connector)

Claude connects to the hosted server itself — no MCP client code on your side. Both halves are
required: `mcp_servers` (the connection) and an `mcp_toolset` entry in `tools` that references it
by name, with the beta `mcp-client-2025-11-20`.

## Python

```python
import anthropic

client = anthropic.Anthropic()  # ANTHROPIC_API_KEY or an `ant auth login` profile

response = client.beta.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    output_config={"effort": "medium"},
    # Server-side refusal fallback: the API re-runs a declined request on a fallback model.
    betas=["mcp-client-2025-11-20", "server-side-fallback-2026-07-01"],
    fallbacks="default",
    mcp_servers=[
        {"type": "url", "url": "https://kotecharts.com/api/v1/mcp", "name": "kote-charts"},
    ],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "kote-charts"}],
    messages=[{
        "role": "user",
        "content": "Using Kote Charts, where is Bitcoin in its cycle by MVRV Z-Score and NUPL? "
                   "Compare with previous cycle tops and cite every chart you use.",
    }],
)

if response.stop_reason == "refusal":
    print("Declined:", response.stop_details)
else:
    print("".join(b.text for b in response.content if b.type == "text"))
```

## TypeScript

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const response = await client.beta.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 16000,
  output_config: { effort: 'medium' },
  betas: ['mcp-client-2025-11-20', 'server-side-fallback-2026-07-01'],
  fallbacks: 'default',
  mcp_servers: [{ type: 'url', url: 'https://kotecharts.com/api/v1/mcp', name: 'kote-charts' }],
  tools: [{ type: 'mcp_toolset', mcp_server_name: 'kote-charts' }],
  messages: [
    {
      role: 'user',
      content: 'Using Kote Charts, summarise exchange netflow over the last 90 days and cite the chart.',
    },
  ],
});

if (response.stop_reason === 'refusal') {
  console.log('Declined:', response.stop_details);
} else {
  for (const block of response.content) if (block.type === 'text') console.log(block.text);
}
```

With an API key, add `"authorization_token": "kote_your_key"` to the `mcp_servers` entry for the
higher rate limit. Runnable versions: [`examples/python/claude_api_agent.py`](../examples/python/claude_api_agent.py),
[`examples/typescript/claude-api-mcp.ts`](../examples/typescript/claude-api-mcp.ts).

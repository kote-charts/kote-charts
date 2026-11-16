# Vercel AI SDK

```bash
npm i ai @ai-sdk/anthropic @modelcontextprotocol/sdk
```

```ts
import { anthropic } from '@ai-sdk/anthropic';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { experimental_createMCPClient as createMCPClient, generateText, stepCountIs } from 'ai';

const mcp = await createMCPClient({
  transport: new StreamableHTTPClientTransport(new URL('https://kotecharts.com/api/v1/mcp')),
});
try {
  const { text } = await generateText({
    model: anthropic('claude-opus-5-5'),
    tools: await mcp.tools(),
    stopWhen: stepCountIs(6),
    prompt: 'Using Kote Charts, how do exchange reserves trend this year? Cite the chart.',
  });
  console.log(text);
} finally {
  await mcp.close();
}
```

The MCP client export moved between AI SDK majors (`experimental_createMCPClient` in `ai` v5,
`createMCPClient` from `@ai-sdk/mcp` later) — use the one your version documents.

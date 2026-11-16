// Claude + the Kote Charts MCP server via the Messages API MCP connector.
// npm i @anthropic-ai/sdk; ANTHROPIC_API_KEY=… npx tsx claude-api-mcp.ts "your question"
import Anthropic from '@anthropic-ai/sdk';

const question =
  process.argv.slice(2).join(' ') ||
  'Using Kote Charts, summarise exchange netflow and whale accumulation over the last 90 days. Cite the charts.';

const client = new Anthropic();
const response = await client.beta.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 16000,
  output_config: { effort: 'medium' },
  betas: ['mcp-client-2025-11-20', 'server-side-fallback-2026-07-01'],
  fallbacks: 'default', // re-run a declined request on a fallback model server-side
  mcp_servers: [{ type: 'url', url: 'https://kotecharts.com/api/v1/mcp', name: 'kote-charts' }],
  tools: [{ type: 'mcp_toolset', mcp_server_name: 'kote-charts' }],
  messages: [{ role: 'user', content: question }],
});

if (response.stop_reason === 'refusal') {
  console.log('Declined:', response.stop_details);
} else {
  for (const block of response.content) if (block.type === 'text') console.log(block.text);
}

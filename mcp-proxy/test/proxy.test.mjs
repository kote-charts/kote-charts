// End-to-end over stdio: spawn the built CLI against KOTE_MCP_URL (defaults to
// the local backend in CI-less dev; CI sets it to production) and walk
// initialize → tools/list → resources/list → prompts/list → a tool call.
import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { remoteHeaders } from '../dist/index.js';

test('Bearer header only when KOTE_API_KEY is set', () => {
  assert.deepEqual(remoteHeaders({}), {});
  assert.deepEqual(remoteHeaders({ KOTE_API_KEY: ' kote_abc ' }), { Authorization: 'Bearer kote_abc' });
});

const url = process.env.KOTE_MCP_URL;
test('proxies the hosted server over stdio', { skip: !url && 'set KOTE_MCP_URL to run' }, async () => {
  const client = new Client({ name: 'proxy-test', version: '0' });
  await client.connect(
    new StdioClientTransport({ command: process.execPath, args: ['dist/index.js'], env: { ...process.env, KOTE_MCP_URL: url } }),
  );
  try {
    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    assert.deepEqual(tools, ['describe_chart', 'get_chart', 'get_latest', 'list_charts']);
    const resources = (await client.listResources()).resources.map((r) => r.uri);
    assert.ok(resources.includes('kote://catalog'));
    const prompts = (await client.listPrompts()).prompts.map((p) => p.name);
    assert.ok(prompts.includes('explain_metric'));
    const res = await client.callTool({ name: 'describe_chart', arguments: { id: 'mvrv-z-score' } });
    const body = JSON.parse(res.content[0].text);
    assert.equal(body.id, 'mvrv-z-score');
    assert.ok(Array.isArray(body.fields));
  } finally {
    await client.close();
  }
});

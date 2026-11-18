#!/usr/bin/env node
// kotecharts-mcp — a local stdio MCP server that forwards every request to the
// hosted Kote Charts MCP server (https://kotecharts.com/api/v1/mcp, Streamable
// HTTP). Use it with MCP clients that only speak stdio:
//
//   npx -y kotecharts-mcp
//
// Env: KOTE_API_KEY (optional: an API key → 3 req/s instead of 60 req/min per IP),
//      KOTE_MCP_URL  (optional: override the remote endpoint).
//
// Nothing is computed locally: tools, resources and prompts are whatever the
// hosted server advertises, so this proxy never goes stale.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export const VERSION = '0.1.2';
export const DEFAULT_URL = 'https://kotecharts.com/api/v1/mcp';

export function remoteHeaders(env: NodeJS.ProcessEnv): Record<string, string> {
  const key = env['KOTE_API_KEY']?.trim();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export async function connectRemote(env: NodeJS.ProcessEnv = process.env): Promise<Client> {
  const url = new URL(env['KOTE_MCP_URL']?.trim() || DEFAULT_URL);
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: remoteHeaders(env) },
  });
  const client = new Client({ name: 'kotecharts-mcp', version: VERSION });
  await client.connect(transport);
  return client;
}

export function proxyServer(remote: Client): Server {
  const info = remote.getServerVersion();
  const caps = remote.getServerCapabilities() ?? {};
  const server = new Server(
    {
      name: info?.name ?? 'kote-analytics',
      version: info?.version ?? VERSION,
      ...(info?.title ? { title: info.title } : {}),
    },
    {
      capabilities: {
        ...(caps.tools ? { tools: {} } : {}),
        ...(caps.resources ? { resources: {} } : {}),
        ...(caps.prompts ? { prompts: {} } : {}),
      },
      ...(remote.getInstructions() ? { instructions: remote.getInstructions() } : {}),
    },
  );
  if (caps.tools) {
    server.setRequestHandler(ListToolsRequestSchema, (req) => remote.listTools(req.params));
    server.setRequestHandler(CallToolRequestSchema, (req) => remote.callTool(req.params));
  }
  if (caps.resources) {
    server.setRequestHandler(ListResourcesRequestSchema, (req) => remote.listResources(req.params));
    server.setRequestHandler(ListResourceTemplatesRequestSchema, (req) =>
      remote.listResourceTemplates(req.params),
    );
    server.setRequestHandler(ReadResourceRequestSchema, (req) => remote.readResource(req.params));
  }
  if (caps.prompts) {
    server.setRequestHandler(ListPromptsRequestSchema, (req) => remote.listPrompts(req.params));
    server.setRequestHandler(GetPromptRequestSchema, (req) => remote.getPrompt(req.params));
  }
  return server;
}

async function main(): Promise<void> {
  let remote: Client;
  try {
    remote = await connectRemote();
  } catch (err) {
    // stdout is the MCP channel — diagnostics go to stderr only.
    process.stderr.write(`kotecharts-mcp: cannot reach the Kote Charts MCP server: ${(err as Error).message}\n`);
    process.exit(1);
  }
  const server = proxyServer(remote);
  await server.connect(new StdioServerTransport());
  const shutdown = async () => {
    await Promise.allSettled([server.close(), remote.close()]);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Run only as the CLI entry (the test imports the module).
const entry = process.argv[1] ?? '';
if (entry.endsWith('kotecharts-mcp') || entry.endsWith('index.js')) {
  void main();
}

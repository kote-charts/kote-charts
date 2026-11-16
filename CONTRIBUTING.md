# Contributing

Issues and pull requests are welcome — especially new client integrations, examples and SDK fixes.

- **Python SDK:** `cd python && pip install -e ".[pandas]" pytest && pytest`
- **TypeScript SDK:** `cd typescript && npm ci && npm run typecheck && npm test && npm run build`
- **MCP proxy:** `cd mcp-proxy && npm ci && npm run build && KOTE_MCP_URL=https://kotecharts.com/api/v1/mcp npm test`
- **Docs:** `docs/mcp.md` and `docs/metrics.md` are generated — run `node scripts/sync-docs.mjs`
  instead of editing them by hand.

The data pipeline and the hosted servers are not part of this repository; data questions and
metric requests go to an issue with the `data` label.

// Public contract tests for https://kotecharts.com — keyless, read-only,
// runnable by anyone:  node --test contract/
// They check what the documentation promises: the OpenAPI schemas match real
// responses, the keyless endpoints answer, the data is fresh, the licence
// travels with every response, and the site, the API and the MCP server agree
// on ONE public chart count. MCP calls are keyless (60/min per IP) — the whole
// suite makes well under 20.
import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';
import { BASE, chartCountLabel, get, mcp, toolJson, validate } from './lib.mjs';

const LICENSE_URL = 'https://kotecharts.com/license';
const DAY_MS = 86_400_000;

let openapi;
let status;
let metrics;

before(async () => {
  const [o, s, m] = await Promise.all([get('/api/v1/openapi.json'), get('/api/v1/status'), get('/api/v1/metrics')]);
  assert.equal(o.res.status, 200, 'openapi.json');
  assert.equal(s.res.status, 200, 'status');
  assert.equal(m.res.status, 200, 'metrics');
  openapi = o.json;
  status = s.json;
  metrics = m.json;
});

const schema = (name) => ({ $ref: `#/components/schemas/${name}` });
const assertValid = (name, value) => {
  const errs = validate(schema(name), value, openapi);
  assert.deepEqual(errs, [], `${name} does not match the OpenAPI schema:\n${errs.slice(0, 10).join('\n')}`);
};

describe('OpenAPI document', () => {
  test('is OpenAPI 3 with explicit, unique operation ids and the data licence', () => {
    assert.match(openapi.openapi, /^3\./);
    assert.equal(openapi.info.license?.url, LICENSE_URL);
    assert.match(openapi.info.license?.name ?? '', /non-commercial/i);
    const ids = Object.values(openapi.paths).flatMap((item) => Object.values(item).map((op) => op.operationId));
    assert.ok(ids.every(Boolean), 'every operation has an operationId');
    assert.equal(new Set(ids).size, ids.length, 'operationIds are unique');
    for (const p of ['/api/v1/health', '/api/v1/status', '/api/v1/metrics', '/api/v1/public/charts/{id}']) {
      assert.ok(openapi.paths[p], `documents ${p}`);
    }
  });

  test('every $ref resolves', () => {
    const refs = JSON.stringify(openapi).match(/"#\/components\/schemas\/[^"]+"/g) ?? [];
    for (const r of new Set(refs)) {
      const name = r.slice(22, -1);
      assert.ok(openapi.components.schemas[name], `unresolved ${name}`);
    }
  });
});

describe('health and status (no key)', () => {
  test('GET /api/v1/health answers ok with the licence link and open CORS', async () => {
    const { res, json } = await get('/api/v1/health');
    assert.equal(res.status, 200);
    assertValid('HealthEnvelope', json);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
    assert.match(res.headers.get('link') ?? '', /<https:\/\/kotecharts\.com\/license>; rel="license"/);
  });

  test('GET /api/v1/status matches its schema and reports a serving API', () => {
    assertValid('StatusEnvelope', status);
    const s = status.data;
    assert.notEqual(s.overall, 'outage', `service reports an outage: ${JSON.stringify(s.components)}`);
    assert.ok(s.charts.public > 0, 'public chart count');
    assert.ok(s.charts.fresh + s.charts.stale === s.charts.public, 'fresh + stale = public');
  });

  // The realized/UTXO processing run completes once a day: allow a day plus slack.
  test('the on-chain processing ran within the last 30 hours', () => {
    const p = status.data.components.find((c) => c.id === 'dataPipeline');
    assert.ok(p, 'dataPipeline component');
    assert.ok(typeof p.analysedBlockHeight === 'number' && p.analysedBlockHeight > 800_000, 'analysed block');
    assert.ok(p.ageMinutes !== null && p.ageMinutes < 30 * 60, `last processing ${p.ageMinutes} minutes ago`);
  });
});

describe('metric catalog (no key)', () => {
  test('GET /api/v1/metrics matches its schema and states the licence', () => {
    assertValid('MetricCatalogEnvelope', metrics);
    const d = metrics.data;
    assert.equal(d.total, d.metrics.length);
    assert.equal(d.license, LICENSE_URL);
    assert.match(d.attribution, /non-commercial/i);
    for (const m of d.metrics) {
      assert.ok(m.cite && m.pageUrl && m.license, `${m.id}: cite / pageUrl / license`);
    }
  });

  test('GET /api/v1/metrics/{id} matches its schema', async () => {
    const { res, json } = await get('/api/v1/metrics/mvrv-z-score');
    assert.equal(res.status, 200);
    assertValid('MetricEnvelope', json);
    assert.ok(json.data.formula && json.data.fields.length > 0);
  });
});

describe('keyed REST API without a key', () => {
  test('answers 401 with the documented error envelope and the licence link', async () => {
    const { res, json } = await get('/api/v1/public/charts/mvrv-z-score');
    assert.equal(res.status, 401);
    assertValid('ErrorEnvelope', json);
    assert.equal(json.error.code, 'UNAUTHORIZED');
    assert.match(res.headers.get('link') ?? '', /rel="license"/);
  });

  test('allows cross-origin browsers (CORS preflight)', async () => {
    const res = await fetch(`${BASE}/api/v1/public/charts`, {
      method: 'OPTIONS',
      headers: {
        origin: 'https://example.org',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization',
      },
      signal: AbortSignal.timeout(30_000),
    });
    assert.ok(res.status === 204 || res.status === 200, `preflight ${res.status}`);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });
});

describe('MCP server (keyless)', () => {
  test('initialize: versioned, licence in the instructions, no "data:" substring', async () => {
    const r = await mcp('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'kote-charts-contract', version: '1' },
    });
    assert.equal(r.res.status, 200);
    assert.ok(!r.text.includes('data:'), 'naive SSE probes misread "data:"');
    const result = r.json.result;
    assert.equal(result.serverInfo.version, status.data.versions.mcp, 'MCP version = /api/v1/status versions.mcp');
    assert.match(result.instructions, /non-commercial/i);
    assert.ok(r.res.headers.get('x-ratelimit-limit'), 'rate-limit headers');
  });

  test('tools/list exposes the four documented tools', async () => {
    const r = await mcp('tools/list');
    const names = r.json.result.tools.map((t) => t.name).sort();
    assert.deepEqual(names, ['describe_chart', 'get_chart', 'get_latest', 'list_charts']);
  });

  test('get_latest is fresh and carries the citation and the licence', async () => {
    const out = toolJson(await mcp('tools/call', { name: 'get_latest', arguments: { id: 'mvrv-z-score' } }));
    assert.match(out.cite, /^Kote Charts — /);
    assert.equal(out.license, LICENSE_URL);
    const last = Date.parse(`${out.asOf?.lastT}T00:00:00Z`);
    assert.ok(Date.now() - last < 3 * DAY_MS, `mvrv-z-score last data day ${out.asOf?.lastT}`);
  });

  test('ONE public chart count: MCP list_charts = /api/v1/metrics = /api/v1/status', async () => {
    const out = toolJson(await mcp('tools/call', { name: 'list_charts', arguments: {} }));
    assert.equal(out.license, LICENSE_URL);
    assert.equal(out.total, out.charts.length);
    assert.equal(out.total, metrics.data.total, 'list_charts vs /api/v1/metrics');
    assert.equal(out.total, status.data.charts.public, 'list_charts vs /api/v1/status');
  });
});

describe('website agrees with the API', () => {
  test('llms.txt, the sitemap and the home page state the same public chart count', async () => {
    const n = status.data.charts.public;
    const llms = (await get('/llms.txt')).text;
    assert.match(llms, new RegExp(`\\b${n} public charts\\b`), `llms.txt must say "${n} public charts"`);
    const sitemap = (await get('/sitemap.xml')).text;
    const chartUrls = new Set(
      [...sitemap.matchAll(/<loc>https:\/\/kotecharts\.com\/c\/([^<]+)<\/loc>/g)].map((m) => m[1]),
    );
    assert.equal(chartUrls.size, n, 'English chart URLs in sitemap.xml');
    const home = (await get('/', { headers: { accept: 'text/html' } })).text;
    assert.ok(home.includes(`${chartCountLabel(n)} charts`), `home page states "${chartCountLabel(n)} charts"`);
    for (const stale of [/\b127 charts\b/, /\b120\+ charts\b/]) assert.ok(!stale.test(home), `home page says ${stale}`);
  });

  test('the licence, status and changelog pages are published', async () => {
    const license = await get('/license', { headers: { accept: 'text/html' } });
    assert.equal(license.res.status, 200);
    assert.match(license.text, /non-commercial/i);
    assert.match(license.text, /prior written permission/i);
    assert.equal((await get('/status', { headers: { accept: 'text/html' } })).res.status, 200);
    const feed = await get('/changelog/feed.xml', { headers: { accept: 'application/atom+xml' } });
    assert.equal(feed.res.status, 200);
    assert.match(feed.text, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
  });
});

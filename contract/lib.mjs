// Shared helpers for the public contract tests — zero dependencies (Node ≥ 20).
// BASE defaults to production; point it at any deployment:
//   KOTE_BASE_URL=https://kotecharts.com node --test contract/

export const BASE = (process.env.KOTE_BASE_URL ?? 'https://kotecharts.com').replace(/\/$/, '');
export const MCP_URL = `${BASE}/api/v1/mcp`;
// The suite names itself on every request, so the service can tell these checks
// apart from real API and MCP usage.
export const USER_AGENT = 'kote-charts-contract/1 (+https://github.com/kote-charts/kote-charts)';

export async function get(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { accept: 'application/json', 'user-agent': USER_AGENT, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { res, text, json };
}

let rpcId = 0;
/**
 * One stateless MCP JSON-RPC call. Keyless: 60 tool calls/minute per IP; the handshake
 * and discovery requests have their own allowance — keep the suite small either way.
 */
export async function mcp(method, params = {}) {
  rpcId += 1;
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'user-agent': USER_AGENT,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: rpcId, method, params }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  return { res, text, json: JSON.parse(text) };
}

/** Parse the JSON payload of an MCP tool result. */
export function toolJson(rpc) {
  const content = rpc.json?.result?.content?.[0]?.text;
  if (typeof content !== 'string') throw new Error(`no tool content: ${JSON.stringify(rpc.json).slice(0, 300)}`);
  return JSON.parse(content);
}

export function chartCountLabel(n) {
  return `${Math.floor(n / 10) * 10}+`;
}

// --- minimal JSON Schema validator for the OpenAPI 3.0 subset our document uses:
// $ref, type (+ nullable), enum, required, properties, additionalProperties,
// items. `format` is not enforced. Returns a list of "path: problem" strings.
export function validate(schema, value, doc, path = '$') {
  const errs = [];
  const s = resolve(schema, doc);
  if (value === null) {
    if (s.nullable || s.type === undefined) return errs;
    return [`${path}: null is not allowed`];
  }
  if (s.enum && !s.enum.includes(value)) errs.push(`${path}: ${JSON.stringify(value)} not in ${JSON.stringify(s.enum)}`);
  const t = s.type;
  if (t === 'object' || (t === undefined && s.properties)) {
    if (typeof value !== 'object' || Array.isArray(value)) return [`${path}: expected object`];
    for (const k of s.required ?? []) if (!(k in value)) errs.push(`${path}: missing required "${k}"`);
    for (const [k, v] of Object.entries(value)) {
      if (s.properties?.[k]) errs.push(...validate(s.properties[k], v, doc, `${path}.${k}`));
      else if (s.additionalProperties === false) errs.push(`${path}: unexpected property "${k}"`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') {
        errs.push(...validate(s.additionalProperties, v, doc, `${path}.${k}`));
      }
    }
  } else if (t === 'array') {
    if (!Array.isArray(value)) return [`${path}: expected array`];
    if (s.items) value.forEach((v, i) => errs.push(...validate(s.items, v, doc, `${path}[${i}]`)));
  } else if (t === 'string') {
    if (typeof value !== 'string') errs.push(`${path}: expected string`);
  } else if (t === 'integer') {
    if (!Number.isInteger(value)) errs.push(`${path}: expected integer`);
  } else if (t === 'number') {
    if (typeof value !== 'number') errs.push(`${path}: expected number`);
  } else if (t === 'boolean') {
    if (typeof value !== 'boolean') errs.push(`${path}: expected boolean`);
  }
  return errs;
}

function resolve(schema, doc) {
  let s = schema;
  for (let i = 0; s && s.$ref && i < 20; i += 1) {
    const name = s.$ref.replace('#/components/schemas/', '');
    s = doc.components?.schemas?.[name];
    if (!s) throw new Error(`unresolved $ref ${schema.$ref}`);
  }
  return s ?? {};
}

// Kote Charts — free Bitcoin on-chain analytics API & MCP server.
// Zero-dependency client over native fetch (Node 18+, browsers, Deno, Bun).
// Types come from the public OpenAPI document (src/openapi.ts, `npm run gen:types`).
//
// Data is free for non-commercial use with attribution: cite "Kote Charts" and
// link https://kotecharts.com/c/{id}. Educational only — not financial advice.
import type { components } from './openapi';

type Schemas = components['schemas'];
export type Granularity = Schemas['Granularity'];
export type ChartCatalog = Schemas['ChartCatalog'];
export type ChartIndexEntry = Schemas['ChartIndexEntry'];
/**
 * One time-series row: `t` (UTC day or timestamp) plus one numeric field per
 * series — units per chart from metric(id).fields. (Declared here because a
 * string `t` next to numeric additionalProperties cannot be expressed by the
 * generated type.)
 */
export interface SeriesPoint {
  t: string;
  partial?: boolean;
  [field: string]: number | string | boolean | null | undefined;
}
export type ChartPayload = Omit<Schemas['ChartPayload'], 'series'> & { series?: SeriesPoint[] };
export type Usage = Schemas['Usage'];
export type Metric = Schemas['Metric'];
export type MetricField = Schemas['MetricField'];
export type MetricCatalog = Schemas['MetricCatalog'];
export type ApiErrorBody = Schemas['ApiError'];
export type { components, paths } from './openapi';

export const VERSION = '0.1.0';
export const DEFAULT_BASE_URL = 'https://kotecharts.com';

export interface KoteChartsOptions {
  /** Free API key (kote_…). Falls back to process.env.KOTE_API_KEY. Not needed for metrics(). */
  apiKey?: string;
  /** Defaults to https://kotecharts.com (or process.env.KOTE_BASE_URL). */
  baseUrl?: string;
  /** Retries for 429 / 502 / 503 / 504 and network errors. Default 3. */
  maxRetries?: number;
  /** Per-request timeout in ms. Default 30 000. */
  timeoutMs?: number;
  /** Custom fetch (tests, proxies). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
}

export interface ChartQuery {
  /** Inclusive start: YYYY-MM-DD, a Date, or a UTC timestamp. */
  from?: string | Date;
  /** Inclusive end: YYYY-MM-DD, a Date, or a UTC timestamp. */
  to?: string | Date;
  granularity?: Granularity;
  /** Venue scope for exchange-netflow only. */
  exchange?: string;
  /** granularity=day only: append the still-open UTC day (partial: true). */
  includePartial?: boolean;
}

export class KoteChartsError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly requestId: string | undefined;
  /** Seconds to wait (429 only). */
  readonly retryAfter: number | undefined;

  constructor(
    message: string,
    opts: { status?: number; code?: string; requestId?: string; retryAfter?: number } = {},
  ) {
    super(message);
    this.name = 'KoteChartsError';
    this.status = opts.status;
    this.code = opts.code;
    this.requestId = opts.requestId;
    this.retryAfter = opts.retryAfter;
  }
}

const RETRY_STATUSES = new Set([429, 502, 503, 504]);
// process is optional (browsers, Deno without --allow-env) — read it defensively.
const env = (name: string): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fmtDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString().replace(/\.\d{3}Z$/, 'Z') : value;
}

/** Numeric field names present in a series (t / partial excluded). */
export function seriesFields(series: readonly SeriesPoint[]): string[] {
  const seen = new Set<string>();
  for (const row of series.slice(-200)) {
    for (const [key, value] of Object.entries(row)) {
      if (key !== 't' && key !== 'partial' && (typeof value === 'number' || value === null)) seen.add(key);
    }
  }
  return [...seen];
}

/** The newest closed row of a series (skips the open-day partial row). */
export function latestPoint(series: readonly SeriesPoint[]): SeriesPoint | null {
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const row = series[i];
    if (row && !row.partial) return row;
  }
  return null;
}

export class KoteCharts {
  readonly baseUrl: string;
  readonly apiKey: string | undefined;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: KoteChartsOptions = {}) {
    this.apiKey = opts.apiKey ?? env('KOTE_API_KEY');
    this.baseUrl = (opts.baseUrl ?? env('KOTE_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.maxRetries = opts.maxRetries ?? 3;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    const f = opts.fetch ?? globalThis.fetch;
    if (typeof f !== 'function') throw new Error('No fetch available — pass options.fetch (Node 18+ has one).');
    this.fetchImpl = f.bind(globalThis);
  }

  // ---------------------------------------------------------------- keyless
  /** Machine-readable methodology for every public chart. No key needed. */
  metrics(): Promise<MetricCatalog> {
    return this.get<MetricCatalog>('/api/v1/metrics', false);
  }

  /** Methodology of one chart: formula, fields with units, sources, limitations, freshness. */
  metric(id: string): Promise<Metric> {
    return this.get<Metric>(`/api/v1/metrics/${encodeURIComponent(id)}`, false);
  }

  // ------------------------------------------------------------------ keyed
  /** Catalog: data window, every published chart with freshness, your rate limit. */
  charts(): Promise<ChartCatalog> {
    return this.get<ChartCatalog>('/api/v1/public/charts', true);
  }

  /** Full-resolution payload of one chart. */
  chart(id: string, query: ChartQuery = {}): Promise<ChartPayload> {
    const params = new URLSearchParams();
    if (query.from !== undefined) params.set('from', fmtDate(query.from));
    if (query.to !== undefined) params.set('to', fmtDate(query.to));
    if (query.granularity !== undefined) params.set('granularity', query.granularity);
    if (query.exchange !== undefined) params.set('exchange', query.exchange);
    if (query.includePartial) params.set('includePartial', 'true');
    const qs = params.toString();
    return this.get<ChartPayload>(`/api/v1/public/charts/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`, true);
  }

  /** Newest closed data row of a time-series chart, or null. */
  async latest(id: string): Promise<SeriesPoint | null> {
    const payload = await this.chart(id);
    return latestPoint(payload.series ?? []);
  }

  /** Your rate limit and today's ok / rate-limited counters. */
  usage(): Promise<Usage> {
    return this.get<Usage>('/api/v1/public/usage', true);
  }

  // -------------------------------------------------------------- transport
  private async get<T>(path: string, keyed: boolean): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (typeof window === 'undefined') headers['user-agent'] = `kotecharts-js/${VERSION}`;
    if (keyed) {
      if (!this.apiKey) {
        throw new KoteChartsError(
          'This endpoint needs a free API key: new KoteCharts({ apiKey }) or KOTE_API_KEY ' +
            '(create one at https://kotecharts.com/account).',
          { status: 401, code: 'UNAUTHORIZED' },
        );
      }
      headers['authorization'] = `Bearer ${this.apiKey}`;
    }
    for (let attempt = 0; ; attempt += 1) {
      let res: Response | undefined;
      try {
        res = await this.fetchImpl(`${this.baseUrl}${path}`, {
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (err) {
        if (attempt >= this.maxRetries) {
          throw new KoteChartsError(`could not reach ${this.baseUrl}: ${(err as Error).message}`);
        }
      }
      if (res && (!RETRY_STATUSES.has(res.status) || attempt >= this.maxRetries)) {
        return unwrap<T>(res);
      }
      await sleep(backoffMs(attempt, res));
    }
  }
}

function retryAfterSec(res: Response | undefined): number | undefined {
  const raw = res?.headers.get('retry-after');
  const n = raw === null || raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function backoffMs(attempt: number, res: Response | undefined): number {
  const hinted = retryAfterSec(res);
  if (hinted !== undefined) return Math.min(Math.max(hinted, 0), 30) * 1000;
  return Math.min(500 * 2 ** attempt, 8000) + Math.random() * 250;
}

async function unwrap<T>(res: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const err = (body as { error?: ApiErrorBody } | null)?.error;
    throw new KoteChartsError(err?.message ?? `HTTP ${res.status}`, {
      status: res.status,
      ...(err?.code !== undefined ? { code: err.code } : {}),
      ...(err?.requestId !== undefined ? { requestId: err.requestId } : {}),
      ...(res.status === 429 && retryAfterSec(res) !== undefined ? { retryAfter: retryAfterSec(res) } : {}),
    });
  }
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export default KoteCharts;

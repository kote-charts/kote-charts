import { describe, expect, it, vi } from 'vitest';
import { KoteCharts, KoteChartsError, latestPoint, seriesFields } from '../src/index';

const KEY = `kote_${'x'.repeat(32)}`;
const SERIES = {
  chart: 'mvrv-z-score',
  granularity: 'day',
  series: [
    { t: '2026-11-14', mvrvZ: 1.1, usd: 70000 },
    { t: '2026-11-15', mvrvZ: 1.2, usd: 71000 },
    { t: '2026-11-16', mvrvZ: 1.3, usd: 72000, partial: true },
  ],
};

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
const ok = (data: unknown) => json(200, { success: true, data });

function mockFetch(...responses: Response[]) {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    const next = responses.shift();
    if (!next) throw new Error('unexpected request');
    return next;
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

describe('KoteCharts', () => {
  it('metrics() is keyless and unwraps the envelope', async () => {
    const { fn, calls } = mockFetch(ok({ total: 1, metrics: [{ id: 'sopr' }] }));
    const kc = new KoteCharts({ fetch: fn, apiKey: '' });
    const out = await kc.metrics();
    expect(out.total).toBe(1);
    expect(calls[0]?.url).toBe('https://kotecharts.com/api/v1/metrics');
    expect(calls[0]?.headers['authorization']).toBeUndefined();
  });

  it('chart() sends the Bearer key and query params', async () => {
    const { fn, calls } = mockFetch(ok(SERIES));
    const kc = new KoteCharts({ fetch: fn, apiKey: KEY, baseUrl: 'http://127.0.0.1:3350/' });
    const out = await kc.chart('mvrv-z-score', {
      from: '2026-01-01',
      to: new Date(Date.UTC(2026, 10, 16, 12)),
      granularity: 'week',
      includePartial: true,
    });
    expect(out.chart).toBe('mvrv-z-score');
    expect(calls[0]?.headers['authorization']).toBe(`Bearer ${KEY}`);
    expect(calls[0]?.url).toBe(
      'http://127.0.0.1:3350/api/v1/public/charts/mvrv-z-score?from=2026-01-01&to=2026-11-16T12%3A00%3A00Z&granularity=week&includePartial=true',
    );
  });

  it('latest() skips the open-day partial row', async () => {
    const { fn } = mockFetch(ok(SERIES));
    expect(await new KoteCharts({ fetch: fn, apiKey: KEY }).latest('mvrv-z-score')).toEqual({
      t: '2026-11-15',
      mvrvZ: 1.2,
      usd: 71000,
    });
  });

  it('keyed calls without a key fail before any request', async () => {
    const { fn } = mockFetch();
    await expect(new KoteCharts({ fetch: fn, apiKey: '' }).charts()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('maps error envelopes to KoteChartsError', async () => {
    const { fn } = mockFetch(
      json(404, { success: false, error: { code: 'NOT_FOUND', message: 'unknown chart', requestId: 'r1' } }),
    );
    const err = await new KoteCharts({ fetch: fn, apiKey: KEY }).chart('nope').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(KoteChartsError);
    expect(err).toMatchObject({ status: 404, code: 'NOT_FOUND', requestId: 'r1', message: 'unknown chart' });
  });

  it('retries a 429 honouring Retry-After', async () => {
    vi.useFakeTimers();
    try {
      const { fn } = mockFetch(
        json(429, { success: false, error: { code: 'RATE_LIMIT', message: 'slow' } }, { 'retry-after': '1' }),
        ok(SERIES),
      );
      const p = new KoteCharts({ fetch: fn, apiKey: KEY }).chart('mvrv-z-score');
      await vi.advanceTimersByTimeAsync(1000);
      expect((await p).chart).toBe('mvrv-z-score');
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('surfaces retryAfter once retries are exhausted', async () => {
    const { fn } = mockFetch(
      json(429, { success: false, error: { code: 'RATE_LIMIT', message: 'slow' } }, { 'retry-after': '2' }),
    );
    const err = await new KoteCharts({ fetch: fn, apiKey: KEY, maxRetries: 0 })
      .usage()
      .catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 429, retryAfter: 2, code: 'RATE_LIMIT' });
  });
});

describe('Retry-After', () => {
  it('throws at once when the requested wait is longer than the cap', async () => {
    const { fn } = mockFetch(
      json(429, { success: false, error: { code: 'RATE_LIMIT', message: 'later' } }, { 'retry-after': '3600' }),
    );
    // No fake timers: a retry would sleep 30 s and time the test out.
    const err = await new KoteCharts({ fetch: fn, apiKey: KEY }).chart('mvrv-z-score').catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 429, retryAfter: 3600, code: 'RATE_LIMIT' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a busy 503 after its Retry-After and exposes it when retries run out', async () => {
    const busy = () =>
      json(503, { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'busy' } }, { 'retry-after': '2' });
    vi.useFakeTimers();
    try {
      const { fn } = mockFetch(busy(), ok(SERIES));
      const p = new KoteCharts({ fetch: fn, apiKey: KEY }).chart('mvrv-z-score');
      await vi.advanceTimersByTimeAsync(2000);
      expect((await p).chart).toBe('mvrv-z-score');
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
    const { fn } = mockFetch(busy());
    const err = await new KoteCharts({ fetch: fn, apiKey: KEY, maxRetries: 0 })
      .chart('mvrv-z-score')
      .catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 503, retryAfter: 2, code: 'SERVICE_UNAVAILABLE' });
  });
});

describe('helpers', () => {
  it('seriesFields lists numeric fields without t/partial', () => {
    expect(seriesFields(SERIES.series)).toEqual(['mvrvZ', 'usd']);
  });
  it('latestPoint returns null for an empty series', () => {
    expect(latestPoint([])).toBeNull();
  });
});

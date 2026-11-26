/**
 * Kote Charts for Google Sheets — Bitcoin on-chain metrics as spreadsheet functions.
 *
 * Install (once per spreadsheet):
 *   1. Extensions → Apps Script → replace the editor contents with this file → Save.
 *   2. Reload the spreadsheet; a "Kote Charts" menu appears → "Set API key".
 *      Create a key at https://kotecharts.com/account (no charge for non-commercial use).
 *
 * Functions:
 *   =KOTE_LATEST("mvrv-z-score")                              latest row: header + values
 *   =KOTE_LATEST("mvrv-z-score", "mvrvZ")                     one number
 *   =KOTE_SERIES("mvrv-z-score", "mvrvZ", "2024-01-01", "week") two columns: date, value
 *   =KOTE_CHARTS()                                            every public chart (no key needed)
 *   =KOTE_CREDIT()                                            the attribution line
 *
 * Chart ids and field names: every chart page on https://kotecharts.com has a
 * "Use this data in code" block, and https://kotecharts.com/api/v1/metrics lists all of them.
 *
 * Limits: 3 requests per second per key. Responses are cached for 10 minutes, so a sheet
 * full of formulas makes one request per distinct chart and range; a 429 is retried.
 *
 * Data licence: non-commercial use with attribution — keep "Data: Kote Charts — kotecharts.com"
 * visible next to the data when others see the sheet (=KOTE_CREDIT()). Commercial use requires
 * prior written permission: https://kotecharts.com/license. Educational only, not financial advice.
 *
 * Code licence: MIT (https://github.com/kote-charts/kote-charts).
 */

var KOTE_BASE = 'https://kotecharts.com';
var KOTE_CACHE_SECONDS = 600;
var KOTE_CREDIT_TEXT = 'Data: Kote Charts — kotecharts.com';

/** Adds the "Kote Charts" menu (simple trigger — runs when the spreadsheet opens). */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Kote Charts')
    .addItem('Set API key', 'koteSetApiKey')
    .addItem('Clear cached data', 'koteClearCache')
    .addToUi();
}

/** Menu action: store the API key in the user's properties (never in the sheet). */
function koteSetApiKey() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.prompt(
    'Kote Charts API key',
    'Paste your kote_… key (create one at https://kotecharts.com/account). ' +
      'It is stored in your Apps Script user properties, not in the spreadsheet.',
    ui.ButtonSet.OK_CANCEL
  );
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var key = answer.getResponseText().trim();
  if (!/^kote_[A-Za-z0-9_-]+$/.test(key)) {
    ui.alert('That does not look like a Kote Charts key — it starts with kote_.');
    return;
  }
  PropertiesService.getUserProperties().setProperty('KOTE_API_KEY', key);
  ui.alert('Saved. Re-enter a formula (or reload the sheet) to fetch fresh data.');
}

/** Menu action: forget cached responses so the next recalculation fetches again. */
function koteClearCache() {
  var props = PropertiesService.getScriptProperties();
  var generation = Number(props.getProperty('KOTE_CACHE_GENERATION') || '0') + 1;
  props.setProperty('KOTE_CACHE_GENERATION', String(generation));
  SpreadsheetApp.getUi().alert('Cache cleared. Formulas fetch fresh data on their next recalculation.');
}

/**
 * The latest closed row of a Kote Charts time series.
 *
 * @param {string} chartId Chart id, e.g. "mvrv-z-score", "nupl", "exchange-netflow".
 * @param {string} field Optional field, e.g. "mvrvZ". Without it: header row + value row.
 * @return The value, or a 2-row table of every field.
 * @customfunction
 */
function KOTE_LATEST(chartId, field) {
  var since = Utilities.formatDate(new Date(Date.now() - 14 * 86400000), 'UTC', 'yyyy-MM-dd');
  var data = koteFetch_('/api/v1/public/charts/' + encodeURIComponent(koteId_(chartId)), { from: since }, true);
  var rows = koteSeries_(data, chartId);
  var last = rows[rows.length - 1];
  if (field) {
    if (!(field in last)) {
      throw new Error('Unknown field "' + field + '" for ' + chartId + '; available: ' + Object.keys(last).join(', '));
    }
    return field === 't' ? koteToDate_(last.t) : koteValue_(last[field]);
  }
  var keys = Object.keys(last);
  return [keys, keys.map(function (k) { return k === 't' ? koteToDate_(last[k]) : koteValue_(last[k]); })];
}

/**
 * A Kote Charts time series as two columns: date and value.
 *
 * @param {string} chartId Chart id, e.g. "mvrv-z-score".
 * @param {string} field Field to return, e.g. "mvrvZ".
 * @param {string|Date} from Optional start date (YYYY-MM-DD or a date cell). Default: one year back.
 * @param {string} granularity Optional: day, 3day, week, month or year. Default: day.
 * @return A table with a header row.
 * @customfunction
 */
function KOTE_SERIES(chartId, field, from, granularity) {
  if (!field) throw new Error('KOTE_SERIES needs a field, e.g. =KOTE_SERIES("' + chartId + '", "…")');
  var start = from ? koteDate_(from) : Utilities.formatDate(new Date(Date.now() - 365 * 86400000), 'UTC', 'yyyy-MM-dd');
  var data = koteFetch_(
    '/api/v1/public/charts/' + encodeURIComponent(koteId_(chartId)),
    { from: start, granularity: granularity || '' },
    true
  );
  var rows = koteSeries_(data, chartId);
  if (!(field in rows[rows.length - 1])) {
    throw new Error('Unknown field "' + field + '" for ' + chartId + '; available: ' + Object.keys(rows[rows.length - 1]).join(', '));
  }
  var out = [['t', field]];
  for (var i = 0; i < rows.length; i++) out.push([koteToDate_(rows[i].t), koteValue_(rows[i][field])]);
  return out;
}

/**
 * Every public Kote Charts chart: id, title, category and update cadence. Needs no API key.
 *
 * @return A table with a header row.
 * @customfunction
 */
function KOTE_CHARTS() {
  var data = koteFetch_('/api/v1/metrics', {}, false);
  var out = [['id', 'title', 'category', 'updateCadence']];
  (data.metrics || []).forEach(function (m) {
    out.push([m.id, m.title || '', m.category || '', m.updateCadence || '']);
  });
  return out;
}

/**
 * The attribution line to keep next to the data: "Data: Kote Charts — kotecharts.com".
 *
 * @return The credit text.
 * @customfunction
 */
function KOTE_CREDIT() {
  return KOTE_CREDIT_TEXT;
}

// ---------------------------------------------------------------- internals

function koteFetch_(path, params, keyed) {
  var query = Object.keys(params)
    .filter(function (k) { return params[k] !== '' && params[k] !== null && params[k] !== undefined; })
    .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');
  var url = KOTE_BASE + path + (query ? '?' + query : '');
  var generation = PropertiesService.getScriptProperties().getProperty('KOTE_CACHE_GENERATION') || '0';
  var cacheKey = 'kote:' + generation + ':' + url;
  if (cacheKey.length > 250) cacheKey = 'kote:' + generation + ':' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, url));
  var cache = CacheService.getScriptCache();
  var hit = cache.get(cacheKey);
  if (hit) return JSON.parse(hit);

  var headers = {};
  if (keyed) {
    // In a shared sheet, custom functions read the spreadsheet OWNER's user properties.
    var key = PropertiesService.getUserProperties().getProperty('KOTE_API_KEY');
    if (!key) throw new Error('No API key: menu Kote Charts → Set API key (create one at https://kotecharts.com/account)');
    headers['X-API-Key'] = key;
  }
  for (var attempt = 0; attempt < 4; attempt++) {
    var res = UrlFetchApp.fetch(url, { headers: headers, muteHttpExceptions: true });
    var code = res.getResponseCode();
    if (code === 429 || code === 503) {
      var h = res.getHeaders();
      var wait = Number(h['Retry-After'] || h['retry-after'] || 1);
      Utilities.sleep(Math.min(Math.max(wait, 1), 5) * 1000 + Math.floor(Math.random() * 500));
      continue;
    }
    var body;
    try {
      body = JSON.parse(res.getContentText());
    } catch (e) {
      throw new Error('Kote Charts: HTTP ' + code + ' (not JSON)');
    }
    if (code !== 200 || !body.success) {
      throw new Error('Kote Charts: HTTP ' + code + ' — ' + ((body.error && body.error.message) || 'request failed'));
    }
    var text = JSON.stringify(body.data);
    if (text.length < 90000) cache.put(cacheKey, text, KOTE_CACHE_SECONDS); // CacheService holds ≤100 KB per value
    return body.data;
  }
  throw new Error('Kote Charts: rate limited (3 requests per second per key) — recalculate in a moment');
}

function koteSeries_(data, chartId) {
  var rows = data && data.series;
  if (!rows || !rows.length) {
    throw new Error('"' + chartId + '" is not a time series (snapshots and distributions are not supported in a cell)');
  }
  return rows;
}

function koteId_(chartId) {
  var id = String(chartId || '').trim();
  if (!id) throw new Error('Pass a chart id, e.g. "mvrv-z-score"');
  return id;
}

function koteDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return Utilities.formatDate(value, 'UTC', 'yyyy-MM-dd');
  return String(value).trim();
}

function koteToDate_(t) {
  // Daily points are "YYYY-MM-DD" (UTC); 5-minute points carry a full UTC timestamp.
  var s = String(t);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00Z') : new Date(s);
}

function koteValue_(v) {
  return v === null || v === undefined ? '' : v;
}

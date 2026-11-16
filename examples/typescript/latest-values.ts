// Today's headline on-chain readings. npm i kotecharts; KOTE_API_KEY=kote_… npx tsx latest-values.ts
// Data: Kote Charts — https://kotecharts.com (non-commercial use; cite the chart pages).
import { KoteCharts } from 'kotecharts';

const kc = new KoteCharts();
const picks: Array<[id: string, field: string]> = [
  ['mvrv-z-score', 'mvrvZ'],
  ['nupl', 'nupl'],
  ['sopr', 'sopr'],
  ['exchange-netflow', 'exNetBtc'],
];

for (const [id, field] of picks) {
  const [row, meta] = await Promise.all([kc.latest(id), kc.metric(id)]);
  const unit = meta.fields?.find((f) => f.key === field)?.unit ?? '';
  console.log(`${meta.title.padEnd(32)} ${String(row?.[field] ?? 'n/a').padStart(12)} ${unit}  (${row?.t}) ${meta.pageUrl}`);
}

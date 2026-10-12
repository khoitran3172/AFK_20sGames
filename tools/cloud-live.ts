// Kiểm tra backend Google Apps Script thật (dùng cloud.url trong src/config.ts). Ghi 1 dòng thử rồi đọc lại.
// Chạy: npx tsx tools/cloud-live.ts
import { cloud } from '../src/config';

async function call(body: unknown) {
  const r = await fetch(cloud.url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t.slice(0, 200) }; }
}
async function main() {
  console.log('url set:', !!cloud.url);
  const id = '0123456789abcdef0123456789abcdef', code = 'AFK-TEST-0001';
  console.log('save', await call({ action: 'save', id, code, data: '{"hello":"world"}', sig: 'x', playMs: 1000, unlocked: 0, ip: '0.0.0.0', device: 'cloud-live test', force: true }));
  const l = await call({ action: 'load', code });
  console.log('load by code', { ...l, data: String(l.data).slice(0, 30) });
  console.log('load by id', (await call({ action: 'load', id })).found);
  console.log('older blocked', await call({ action: 'save', id, code, data: '{}', sig: 'x', playMs: -999999, unlocked: 0 }));
  console.log('bad id', await call({ action: 'save', id: 'zz', code, data: '{}' }));
}
main();

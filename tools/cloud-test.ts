// Kiểm tra luồng đồng bộ đám mây với một "Apps Script" giả (cùng giao thức như backend/Code.gs).
// Chạy: npx tsx tools/cloud-test.ts
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
(globalThis as any).document = { addEventListener() {} };
(globalThis as any).location = { search: '' };
(globalThis as any).navigator = { userAgent: 'test' };

const rows: any[] = [];
(globalThis as any).fetch = async (url: string, init?: any) => {
  if (String(url).includes('ipify')) return { json: async () => ({ ip: '1.2.3.4' }) };
  const r = JSON.parse(init.body);
  const find = (f: (x: any) => boolean) => rows.find(f);
  let res: any;
  if (r.action === 'save') {
    let row = find((x) => x.id === r.id);
    if (!row) { if (find((x) => x.code === r.code)) res = { ok: false, err: 'code_taken' }; else { row = { id: r.id, code: r.code }; rows.push(row); } }
    else if (!r.force && r.playMs + 120000 < row.playMs) res = { ok: false, err: 'older' };
    if (!res) { Object.assign(row, { playMs: r.playMs, sig: r.sig, data: r.data, ip: r.ip }); res = { ok: true }; }
  } else {
    const row = find((x) => (r.id ? x.id === r.id : false) || (r.code && x.code === r.code));
    res = row ? { ok: true, found: true, ...row } : { ok: true, found: false };
  }
  return { json: async () => res };
};

async function main() {
  const cfg = await import('../src/config');
  cfg.cloud.url = 'https://mock';
  const st = await import('../src/core/state');
  const cl = await import('../src/core/cloud');
  const s = st.getSave();
  s.playMs = 500000; s.unlocked = 7; s.gold = 12345;
  const ok = await cl.pushSave(true);
  console.log('push', ok, 'rows', rows.length, 'ip', rows[0]?.ip, 'code', cl.recoveryCode());
  // máy khác: nhập mã khôi phục
  const c = await cl.pullSave(cl.recoveryCode());
  console.log('pull by code found', c.found, 'playMs', c.playMs, 'sig ok', c.found && st.verifyRaw(c.data!, c.sig!));
  // dữ liệu bị sửa => từ chối
  const bad = { ...c, data: c.data!.replace('12345', '99999999') };
  console.log('tampered applied (phải false):', cl.applyCloud(bad));
  console.log('legit applied (phải true):', cl.applyCloud(c));
  // chống ghi đè lùi
  s.playMs = 1000;
  console.log('older push blocked (phải false):', await cl.pushSave(false, false));
}
main();

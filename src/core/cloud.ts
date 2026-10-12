// Lưu đám mây qua Google Apps Script + Google Sheet (backend/Code.gs).
// Định danh: id thiết bị ngẫu nhiên (localStorage) + MÃ KHÔI PHỤC hiển thị cho người chơi để chuyển máy
// hoặc khi trình duyệt (vd. Facebook) xóa dữ liệu. IP chỉ được ghi kèm để tham khảo: IP đổi theo mạng và
// nhiều người dùng chung IP nên không thể làm khóa lưu.
import { cloud } from '../config';
import { exportRaw, getSave, importRaw, verifyRaw } from './state';

const K_ID = 'afk_dev', K_CODE = 'afk_code', K_LAST = 'afk_cloud_last';
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const cloudEnabled = () => !!cloud.url;

function rnd(n: number, alpha: string): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => alpha[b % alpha.length]).join('');
}
function ls(k: string, make: () => string): string {
  try { let v = localStorage.getItem(k); if (!v) { v = make(); localStorage.setItem(k, v); } return v; } catch { return make(); }
}
export const deviceId = () => ls(K_ID, () => rnd(32, '0123456789abcdef'));
/** Mã khôi phục dạng AFK-XXXX-XXXX (bỏ ký tự dễ nhầm) */
export const recoveryCode = () => ls(K_CODE, () => `AFK-${rnd(4, CODE_CHARS)}-${rnd(4, CODE_CHARS)}`);
const setIdentity = (id: string, code: string) => { try { localStorage.setItem(K_ID, id); localStorage.setItem(K_CODE, code); } catch { /* ignore */ } };

export const status = { state: 'idle' as 'idle' | 'busy' | 'ok' | 'err', last: 0, msg: '' };
try { status.last = Number(localStorage.getItem(K_LAST) || 0); } catch { /* ignore */ }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(body: Record<string, unknown>, keepalive = false): Promise<any> {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 15000);
  try {
    // text/plain => "simple request", không bị preflight CORS (Apps Script không trả preflight)
    const r = await fetch(cloud.url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl.signal, keepalive });
    return await r.json();
  } finally { clearTimeout(to); }
}

let ip = '';
async function getIp(): Promise<string> {
  if (!cloud.logIp) return '';
  if (ip) return ip;
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch('https://api.ipify.org?format=json', { signal: ctl.signal });
    clearTimeout(to);
    ip = (await r.json()).ip ?? '';
  } catch { ip = ''; }
  return ip;
}

let lastPushed = '';
export async function pushSave(force = false, keepalive = false): Promise<boolean> {
  if (!cloudEnabled()) return false;
  const { raw, sig } = exportRaw();
  if (!force && raw === lastPushed) return true;
  status.state = 'busy';
  try {
    const S = getSave();
    const res = await call({ action: 'save', id: deviceId(), code: recoveryCode(), data: raw, sig, playMs: S.playMs, unlocked: S.unlocked, force, ip: await getIp(), device: navigator.userAgent }, keepalive);
    if (!res.ok) { status.state = 'err'; status.msg = res.err ?? 'error'; return false; }
    lastPushed = raw; status.state = 'ok'; status.last = Date.now(); status.msg = '';
    try { localStorage.setItem(K_LAST, String(status.last)); } catch { /* ignore */ }
    return true;
  } catch (e) { status.state = 'err'; status.msg = String(e); return false; }
}

export interface CloudSave { found: boolean; playMs?: number; unlocked?: number; updatedAt?: string; data?: string; sig?: string; id?: string; code?: string }
export async function pullSave(code?: string): Promise<CloudSave> {
  status.state = 'busy';
  try {
    const res = await call(code ? { action: 'load', code } : { action: 'load', id: deviceId() });
    status.state = res.ok ? 'ok' : 'err';
    return res.ok ? res : { found: false };
  } catch (e) { status.state = 'err'; status.msg = String(e); return { found: false }; }
}

/** Áp dụng save tải về (nhận luôn id + mã của bản ghi để các máy dùng chung 1 hồ sơ). Trả về true nếu hợp lệ. */
export function applyCloud(c: CloudSave): boolean {
  if (!c.found || !c.data || !c.sig || !c.id || !c.code) return false;
  if (!verifyRaw(c.data, c.sig)) return false; // chữ ký sai: dữ liệu bị sửa ngoài game
  if (!importRaw(c.data)) return false;
  setIdentity(c.id, c.code);
  return true;
}

/** Khi khởi động: nếu đám mây (cùng id) có tiến độ hơn máy này thì báo để người chơi khôi phục; còn lại tự đẩy định kỳ. */
export let restoreOffer: CloudSave | null = null;
export const clearOffer = () => { restoreOffer = null; };
export function startCloud() {
  if (!cloudEnabled()) return;
  deviceId(); recoveryCode();
  void (async () => {
    const c = await pullSave();
    if (c.found && (c.playMs ?? 0) > getSave().playMs + 60000) restoreOffer = c;
    else await pushSave(true);
  })();
  setInterval(() => { if (!restoreOffer) void pushSave(); }, 90000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && !restoreOffer) void pushSave(false, true); });
}

// Đồng hồ chống gian lận: lấy giờ từ MÁY CHỦ (header `Date` của chính trang web), sau đó chạy tiếp bằng performance.now()
// (không đổi khi người chơi chỉnh giờ hệ thống). Nếu không lấy được giờ máy chủ, đồng hồ ở trạng thái "không tin cậy"
// và các phần thưởng dựa vào thời gian (offline, qua ngày) bị giới hạn mạnh.
let base = { srv: Date.now(), perf: 0, ok: false };

export async function syncClock(): Promise<boolean> {
  try {
    const t0 = performance.now();
    const r = await Promise.race([
      fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store' }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
    const d = r.headers.get('date');
    const ms = d ? Date.parse(d) : NaN;
    if (!isFinite(ms)) throw new Error('no date header');
    const rtt = performance.now() - t0;
    base = { srv: ms + rtt / 2, perf: performance.now(), ok: true };
    return true;
  } catch {
    base = { srv: Date.now(), perf: performance.now(), ok: false };
    return false;
  }
}

/** Giờ hiện tại (ms) theo máy chủ, miễn nhiễm với việc đổi giờ hệ thống trong phiên */
export const now = (): number => base.srv + (performance.now() - base.perf);
export const trusted = (): boolean => base.ok;

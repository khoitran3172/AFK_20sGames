/**
 * Backend lưu save lên Google Sheet cho game "Biên Niên Thủ Lĩnh".
 * Cách cài: xem docs/CLOUD_SAVE.md (Extensions → Apps Script → dán file này → Deploy → Web app).
 *
 * Mỗi người chơi = 1 dòng trong sheet "saves":
 *   A id thiết bị (bí mật) | B mã khôi phục | C cập nhật lúc | D playMs | E Arena mở | F IP (chỉ để tham khảo)
 *   G thiết bị | H chữ ký | I..L save (cắt khúc 45k ký tự/ô)
 * Client gửi POST text/plain (tránh CORS preflight) với body JSON: {action:'save'|'load', ...}
 */
const SHEET = 'saves';
const CHUNK = 45000;
const CHUNKS = 4;
const HEADERS = ['id', 'code', 'updatedAt', 'playMs', 'unlocked', 'ip', 'device', 'sig', 'd1', 'd2', 'd3', 'd4'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function findRow_(sh, col, value) {
  if (!value || sh.getLastRow() < 2) return 0;
  const f = sh.getRange(2, col, sh.getLastRow() - 1, 1).createTextFinder(String(value)).matchEntireCell(true).matchCase(true).findNext();
  return f ? f.getRow() : 0;
}

function doGet() { return out_({ ok: true, service: 'afk-cloud-save' }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const req = JSON.parse(e.postData.contents);
    const sh = sheet_();
    if (req.action === 'save') return save_(sh, req);
    if (req.action === 'load') return load_(sh, req);
    return out_({ ok: false, err: 'bad_action' });
  } catch (err) {
    return out_({ ok: false, err: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function save_(sh, r) {
  if (!r.id || !/^[a-f0-9]{16,64}$/.test(r.id) || !r.code || !/^[A-Z0-9-]{6,20}$/.test(r.code)) return out_({ ok: false, err: 'bad_id' });
  const data = String(r.data || '');
  if (!data || data.length > CHUNK * CHUNKS) return out_({ ok: false, err: 'bad_size' });
  let row = findRow_(sh, 1, r.id);
  if (!row) {
    // mã khôi phục phải duy nhất
    if (findRow_(sh, 2, r.code)) return out_({ ok: false, err: 'code_taken' });
    sh.appendRow([r.id, r.code]);
    row = sh.getLastRow();
  } else {
    // chống ghi đè lùi: không cho bản có playMs thấp hơn nhiều đè bản đã lưu (trừ khi force)
    const old = Number(sh.getRange(row, 4).getValue()) || 0;
    if (!r.force && Number(r.playMs) + 120000 < old) return out_({ ok: false, err: 'older', playMs: old });
  }
  const parts = [];
  for (let i = 0; i < CHUNKS; i++) parts.push(data.substr(i * CHUNK, CHUNK));
  const now = new Date().toISOString();
  sh.getRange(row, 3, 1, 10).setValues([[now, Number(r.playMs) || 0, Number(r.unlocked) || 0, String(r.ip || ''), String(r.device || '').slice(0, 120), String(r.sig || ''), parts[0], parts[1], parts[2], parts[3]]]);
  return out_({ ok: true, updatedAt: now });
}

function load_(sh, r) {
  let row = r.id ? findRow_(sh, 1, r.id) : 0;
  if (!row && r.code) row = findRow_(sh, 2, String(r.code).toUpperCase().trim());
  if (!row) return out_({ ok: true, found: false });
  const v = sh.getRange(row, 1, 1, 12).getValues()[0];
  return out_({ ok: true, found: true, id: v[0], code: v[1], updatedAt: v[2], playMs: v[3], unlocked: v[4], sig: v[7], data: v[8] + v[9] + v[10] + v[11] });
}

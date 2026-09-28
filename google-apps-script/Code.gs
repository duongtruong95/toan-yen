/**
 * Backend miễn phí cho thiệp cưới: lưu Lời chúc & Xác nhận tham dự vào Google Sheets.
 *
 * Cách cài (chi tiết trong README.md, mục "Lưu lời chúc & xác nhận vào Google Sheets"):
 *   1. Tạo một Google Sheet mới → menu Tiện ích mở rộng (Extensions) → Apps Script.
 *   2. Xoá code mẫu, dán toàn bộ file này vào, bấm Lưu.
 *   3. Triển khai (Deploy) → Tùy chọn triển khai mới (New deployment) → loại "Ứng dụng web" (Web app)
 *        - Thực thi dưới dạng (Execute as): Tôi (Me)
 *        - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *   4. Cấp quyền, sao chép URL kết thúc bằng /exec, dán vào api.endpoint trong assets/js/config.js.
 *
 * Ẩn một lời chúc không phù hợp: đổi ô cột "Hiển thị" của dòng đó thành FALSE.
 * Sau khi sửa code này, phải Deploy → Quản lý triển khai → chỉnh sửa → Phiên bản mới thì mới có hiệu lực.
 */

const SHEETS = {
  wish: { name: 'LoiChuc', headers: ['Thời gian', 'Họ tên', 'Email', 'Lời chúc', 'Hiển thị'] },
  rsvp: { name: 'XacNhan', headers: ['Thời gian', 'Họ tên', 'Điện thoại', 'Tham dự', 'Số người', 'Khách của', 'Lời nhắn'] },
};
const MAX_WISHES = 300; // số lời chúc mới nhất trả về cho trang web

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'wishes';
  if (action !== 'wishes') return json_({ ok: false, error: 'Yêu cầu không hợp lệ' });

  const sh = sheet_('wish');
  const last = sh.getLastRow();
  if (last < 2) return json_({ ok: true, data: [] });

  const start = Math.max(2, last - MAX_WISHES + 1);
  const rows = sh.getRange(start, 1, last - start + 1, 5).getValues();
  const data = rows
    .filter((r) => r[1] && r[3] && String(r[4]).toUpperCase() !== 'FALSE')
    .reverse()
    .map((r) => ({
      name: String(r[1]),
      message: String(r[3]),
      time: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    }));
  return json_({ ok: true, data });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Dữ liệu không hợp lệ' });
  }
  if (body.website) return json_({ ok: true }); // ô bẫy chống bot

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.type === 'wish') {
      const name = clean_(body.name, 60);
      const message = clean_(body.message, 1000);
      if (!name || !message) return json_({ ok: false, error: 'Thiếu tên hoặc lời chúc' });
      sheet_('wish').appendRow([new Date(), name, clean_(body.email, 100), message, true]);
      return json_({ ok: true });
    }
    if (body.type === 'rsvp') {
      const name = clean_(body.name, 60);
      if (!name) return json_({ ok: false, error: 'Thiếu họ tên' });
      const attend = body.attend === 'no' ? 'Không' : 'Có';
      const guests = attend === 'Có' ? Math.max(1, Math.min(20, parseInt(body.guests, 10) || 1)) : 0;
      sheet_('rsvp').appendRow([
        new Date(), name, clean_(body.phone, 20), attend, guests, clean_(body.side, 20), clean_(body.note, 500),
      ]);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: 'Loại dữ liệu không hợp lệ' });
  } finally {
    lock.releaseLock();
  }
}

// Cắt độ dài và chặn công thức (=, +, -, @) để không bị chèn công thức vào bảng tính
function clean_(value, max) {
  const v = String(value == null ? '' : value).trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function sheet_(key) {
  const cfg = SHEETS[key];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) {
    sh = ss.insertSheet(cfg.name);
    sh.appendRow(cfg.headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, cfg.headers.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

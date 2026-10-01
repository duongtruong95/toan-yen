/**
 * Backend miễn phí cho thiệp cưới: lưu Lời chúc & Xác nhận tham dự vào Google Sheets.
 *
 * Cách cài (chi tiết trong README.md, mục "Lưu lời chúc & xác nhận vào Google Sheets"):
 *   1. Tạo một Google Sheet mới → menu Tiện ích mở rộng (Extensions) → Apps Script.
 *   2. Xoá code mẫu, dán toàn bộ file này vào, ĐỔI MAT_KHAU bên dưới, bấm Lưu.
 *   3. Triển khai (Deploy) → Tùy chọn triển khai mới (New deployment) → loại "Ứng dụng web" (Web app)
 *        - Thực thi dưới dạng (Execute as): Tôi (Me)
 *        - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *   4. Cấp quyền, sao chép URL kết thúc bằng /exec, dán vào api.endpoint trong assets/js/config.js.
 *
 * Xem danh sách khách: mở trang quan-ly.html của thiệp, nhập MAT_KHAU.
 * Ẩn một lời chúc không phù hợp: đổi ô cột "Hiển thị" của dòng đó thành FALSE.
 * Sau khi sửa code này, phải Deploy → Quản lý triển khai → chỉnh sửa → Phiên bản mới thì mới có hiệu lực.
 */

// Mật khẩu của trang quan-ly.html (xem danh sách xác nhận & lời chúc). ĐỔI trước khi triển khai,
// đừng để lộ: ai có mật khẩu sẽ xem được tên và số điện thoại của khách.
const MAT_KHAU = 'doi-mat-khau-nay';

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
      time: time_(r[0]),
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
  if (body.type === 'admin') return admin_(body);

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
        new Date(), name, text_(body.phone, 20), attend, guests, clean_(body.side, 20), clean_(body.note, 500),
      ]);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: 'Loại dữ liệu không hợp lệ' });
  } finally {
    lock.releaseLock();
  }
}

// Trang quan-ly.html: trả toàn bộ xác nhận & lời chúc khi đúng mật khẩu
function admin_(body) {
  if (!MAT_KHAU || MAT_KHAU === 'doi-mat-khau-nay') {
    return json_({ ok: false, error: 'Chưa đặt mật khẩu: sửa dòng MAT_KHAU trong Apps Script rồi triển khai phiên bản mới.' });
  }
  if (String(body.key || '') !== MAT_KHAU) {
    Utilities.sleep(1500); // làm chậm việc dò mật khẩu
    return json_({ ok: false, error: 'Sai mật khẩu' });
  }
  const rsvp = rows_('rsvp').map((r) => ({
    time: time_(r[0]), name: String(r[1]), phone: String(r[2]), attend: String(r[3]),
    guests: Number(r[4]) || 0, side: String(r[5]), note: String(r[6]),
  }));
  const wishes = rows_('wish').map((r) => ({
    time: time_(r[0]), name: String(r[1]), email: String(r[2]), message: String(r[3]),
    visible: String(r[4]).toUpperCase() !== 'FALSE',
  }));
  return json_({ ok: true, rsvp, wishes });
}

function rows_(key) {
  const sh = sheet_(key);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, SHEETS[key].headers.length).getValues().filter((r) => r[1]);
}

function time_(v) {
  return v instanceof Date ? v.toISOString() : String(v);
}

// Cắt độ dài và chặn công thức (=, +, -, @) để không bị chèn công thức vào bảng tính
function clean_(value, max) {
  const v = String(value == null ? '' : value).trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Luôn lưu dạng chữ, để số điện thoại không bị mất số 0 ở đầu
function text_(value, max) {
  const v = String(value == null ? '' : value).trim().replace(/^'+/, '').slice(0, max);
  return v ? "'" + v : '';
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

/* Trang quan-ly.html: danh sách xác nhận tham dự & lời chúc cho cô dâu chú rể.
   Có api.endpoint (Google Apps Script): tải dữ liệu thật, cần mật khẩu MAT_KHAU đặt trong Code.gs.
   Chưa có: chế độ demo, đọc dữ liệu gửi thử lưu trên trình duyệt này. */
(function () {
  'use strict';

  const C = window.WEDDING || {};
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  const fold = (s) => slugify(s).replace(/-/g, ' '); // bỏ dấu để tìm kiếm
  const digits = (s) => String(s || '').replace(/\D/g, '');

  const groom = C.groom || {};
  const bride = C.bride || {};
  const couple = [groom.name, bride.name].filter(Boolean).join(' & ');
  const SLUG = slugify(`${groom.name || ''}-${bride.name || ''}`) || 'wedding'; // giống app.js
  const API = String((C.api && C.api.endpoint) || '').trim();
  const KEY = `quan-ly:${SLUG}:key`;

  const store = {
    get() { try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
    set(v, remember) { try { (remember ? localStorage : sessionStorage).setItem(KEY, v); } catch (e) { /* bộ nhớ bị chặn */ } },
    del() { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } },
  };
  const local = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };

  let data = { rsvp: [], wishes: [] };
  let tab = 'rsvp';
  let key = '';
  let loadedAt = null;

  const fmt = (v) => {
    const d = new Date(v);
    return isNaN(d) ? '' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const newestFirst = (a, b) => (Date.parse(b.time) || 0) - (Date.parse(a.time) || 0);

  function normRsvp(r) {
    const attend = r.attend === 'no' || r.attend === 'Không' ? 'Không' : 'Có';
    return {
      time: r.time || '',
      name: String(r.name || ''),
      phone: String(r.phone || '').replace(/^'+/, ''),
      attend,
      guests: attend === 'Có' ? Math.max(1, parseInt(r.guests, 10) || 1) : 0,
      side: String(r.side || ''),
      note: String(r.note || ''),
    };
  }
  const normWish = (w) => ({
    time: w.time || '', name: String(w.name || ''), email: String(w.email || ''),
    message: String(w.message || ''), visible: w.visible !== false,
  });

  // Một khách gửi nhiều lần: chỉ tính lần mới nhất (cùng số điện thoại, không có số thì cùng tên)
  function markOld(list) {
    const seen = new Set();
    list.sort(newestFirst).forEach((r) => {
      const p = digits(r.phone);
      const id = p.length >= 9 ? `p${p.slice(-9)}` : `n${fold(r.name)}`;
      r.old = seen.has(id);
      seen.add(id);
    });
    return list;
  }

  async function fetchData(k) {
    if (!API) return { demo: true, rsvp: local(`thiep:${SLUG}:rsvp`), wishes: local(`thiep:${SLUG}:wishes`) };
    let json;
    try {
      // text/plain để tránh CORS preflight với Google Apps Script; mật khẩu nằm trong thân, không nằm trên URL
      const res = await fetch(API, { method: 'POST', body: JSON.stringify({ type: 'admin', key: k }) });
      json = await res.json();
    } catch (e) {
      throw new Error('Không kết nối được tới Google Sheets, bạn thử lại sau ít phút nhé.');
    }
    if (!json.ok) throw new Error(json.error || 'Không tải được dữ liệu');
    return json;
  }

  async function load(k) {
    const json = await fetchData(k);
    data = {
      rsvp: markOld((json.rsvp || []).map(normRsvp)),
      wishes: (json.wishes || []).map(normWish).sort(newestFirst),
    };
    key = k;
    loadedAt = new Date();
    $('demo').hidden = !json.demo;
    $('logout').hidden = !API;
    $('login').hidden = true;
    $('app').hidden = false;
    render();
  }

  function summary() {
    const cur = data.rsvp.filter((r) => !r.old);
    const yes = cur.filter((r) => r.attend === 'Có');
    const sum = (list) => list.reduce((s, r) => s + r.guests, 0);
    return {
      attending_guests: sum(yes),
      groom_side: sum(yes.filter((r) => r.side === 'Nhà trai')),
      bride_side: sum(yes.filter((r) => r.side === 'Nhà gái')),
      attending_responses: yes.length,
      declined: cur.length - yes.length,
      wishes: data.wishes.length,
    };
  }

  function matches(text, q, phone) {
    if (!q) return true;
    if (fold(text).includes(fold(q))) return true;
    const qd = digits(q);
    return qd.length >= 3 && digits(phone).includes(qd);
  }

  function visibleRows() {
    const q = $('q').value.trim();
    if (tab === 'wishes') return data.wishes.filter((w) => matches(`${w.name} ${w.email} ${w.message}`, q, ''));
    const a = $('f-attend').value;
    const s = $('f-side').value;
    return data.rsvp.filter((r) => (!a || r.attend === a) && (!s || r.side === s)
      && matches(`${r.name} ${r.phone} ${r.note}`, q, r.phone));
  }

  function render() {
    const s = summary();
    $('s-guests').textContent = s.attending_guests;
    $('s-yes').textContent = `${s.attending_responses} lượt xác nhận`;
    $('s-groom').textContent = s.groom_side;
    $('s-bride').textContent = s.bride_side;
    $('s-no').textContent = s.declined;
    $('s-wishes').textContent = s.wishes;
    $('n-rsvp').textContent = `(${data.rsvp.length})`;
    $('n-wishes').textContent = `(${data.wishes.length})`;
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('f-attend').hidden = $('f-side').hidden = tab !== 'rsvp';

    const rows = visibleRows();
    if (tab === 'rsvp') {
      $('table').innerHTML = `<thead><tr><th>#</th><th>Thời gian</th><th>Họ tên</th><th>Điện thoại</th><th>Tham dự</th><th>Số người</th><th>Khách của</th><th>Lời nhắn</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr${r.old ? ' class="is-old"' : ''}>
          <td class="idx">${i + 1}</td>
          <td data-label="Thời gian">${esc(fmt(r.time))}</td>
          <td data-label="Họ tên"><b>${esc(r.name)}</b>${r.old ? ' <span class="badge">lần gửi cũ</span>' : ''}</td>
          <td data-label="Điện thoại">${r.phone ? `<a href="tel:${esc(r.phone.replace(/[^\d+]/g, ''))}">${esc(r.phone)}</a>` : ''}</td>
          <td data-label="Tham dự"><span class="badge${r.attend === 'Có' ? ' badge--yes' : ''}">${r.attend === 'Có' ? 'Sẽ đến' : 'Không đến'}</span></td>
          <td class="num" data-label="Số người">${r.guests || ''}</td>
          <td data-label="Khách của">${esc(r.side)}</td>
          <td class="wrap" data-label="Lời nhắn">${esc(r.note)}</td>
        </tr>`).join('')}</tbody>`;
    } else {
      $('table').innerHTML = `<thead><tr><th>#</th><th>Thời gian</th><th>Họ tên</th><th>Email</th><th>Lời chúc</th><th>Hiển thị</th></tr></thead>
        <tbody>${rows.map((w, i) => `<tr${w.visible ? '' : ' class="is-old"'}>
          <td class="idx">${i + 1}</td>
          <td data-label="Thời gian">${esc(fmt(w.time))}</td>
          <td data-label="Họ tên"><b>${esc(w.name)}</b></td>
          <td data-label="Email">${w.email ? `<a href="mailto:${esc(w.email)}">${esc(w.email)}</a>` : ''}</td>
          <td class="wrap" data-label="Lời chúc">${esc(w.message)}</td>
          <td data-label="Hiển thị">${w.visible ? 'Có' : '<span class="badge">Đã ẩn</span>'}</td>
        </tr>`).join('')}</tbody>`;
    }
    const total = data[tab].length;
    $('empty').hidden = rows.length > 0;
    $('empty').textContent = total ? 'Không có dòng nào khớp với bộ lọc.'
      : tab === 'rsvp' ? 'Chưa có khách nào xác nhận.' : 'Chưa có lời chúc nào.';
    $('updated').textContent = `Cập nhật lúc ${fmt(loadedAt)}.`
      + (tab === 'rsvp' ? ' Khách gửi nhiều lần chỉ được tính lần mới nhất, các dòng mờ là lần gửi cũ.' : '');
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const stamp = () => { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; };

  function exportJson() {
    const rsvp = data.rsvp.map(({ old, ...r }) => ({ ...r, latest: !old }));
    const body = { couple, exportedAt: new Date().toISOString(), summary: summary(), rsvp, wishes: data.wishes };
    download(`khach-moi-${SLUG}-${stamp()}.json`, JSON.stringify(body, null, 2), 'application/json;charset=utf-8');
  }

  function exportCsv() {
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const table = tab === 'rsvp'
      ? [['Thời gian', 'Họ tên', 'Điện thoại', 'Tham dự', 'Số người', 'Khách của', 'Lời nhắn', 'Lần mới nhất']]
        .concat(data.rsvp.map((r) => [fmt(r.time), r.name, r.phone, r.attend, r.guests, r.side, r.note, r.old ? 'Không' : 'Có']))
      : [['Thời gian', 'Họ tên', 'Email', 'Lời chúc', 'Hiển thị']]
        .concat(data.wishes.map((w) => [fmt(w.time), w.name, w.email, w.message, w.visible ? 'Có' : 'Không']));
    // ﻿ (BOM) để Excel đọc đúng tiếng Việt
    const csv = '﻿' + table.map((r) => r.map(q).join(',')).join('\r\n');
    download(`${tab === 'rsvp' ? 'xac-nhan-tham-du' : 'loi-chuc'}-${SLUG}-${stamp()}.csv`, csv, 'text/csv;charset=utf-8');
  }

  function showLogin(message) {
    $('app').hidden = true;
    $('login').hidden = false;
    $('login-msg').textContent = message || '';
    $('key').focus();
  }

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const k = $('key').value;
    const btn = e.submitter || $('login-form').querySelector('button');
    btn.disabled = true;
    $('login-msg').textContent = 'Đang kiểm tra…';
    try {
      await load(k);
      store.set(k, $('remember').checked);
      $('key').value = '';
    } catch (err) {
      $('login-msg').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $('reload').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Đang tải…';
    try {
      await load(key);
    } catch (err) {
      if (/mật khẩu/i.test(err.message)) { store.del(); showLogin(err.message); } else alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Tải lại';
    }
  });
  $('logout').addEventListener('click', () => {
    store.del();
    data = { rsvp: [], wishes: [] };
    key = '';
    showLogin('');
  });
  $('json').addEventListener('click', exportJson);
  $('csv').addEventListener('click', exportCsv);
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  ['q', 'f-attend', 'f-side'].forEach((id) => $(id).addEventListener('input', render));

  if (couple) $('couple').textContent = `Danh sách xác nhận tham dự & lời chúc · ${couple}`;
  if (!API) {
    load('');
  } else {
    const saved = store.get();
    if (!saved) showLogin('');
    else load(saved).catch((err) => { if (/mật khẩu/i.test(err.message)) store.del(); showLogin(err.message); });
  }
})();

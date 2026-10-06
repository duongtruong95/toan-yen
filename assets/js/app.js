/* =====================================================================
   Thiệp cưới — dựng nội dung từ config.js và xử lý tương tác.
   Không cần build, không dùng thư viện ngoài.
   ===================================================================== */
(function () {
  'use strict';

  const C = window.WEDDING;
  const app = document.getElementById('app');
  if (!C || typeof C !== 'object') {
    app.innerHTML = '<p class="config-error">Không đọc được <code>assets/js/config.js</code>.<br>' +
      'Có thể file đang bị lỗi cú pháp (thiếu dấu phẩy, dấu nháy hoặc dấu ngoặc).<br>' +
      'Nhấn F12 → tab Console để xem dòng bị lỗi.</p>';
    return;
  }

  /* ---------- Tiện ích ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  // Cho phép viết gọn một mục bằng mảng, ví dụ album: ["a.jpg", "b.jpg"]
  const block = (v, key) => (v == null ? null : Array.isArray(v) ? { [key]: v } : v);

  const groom = C.groom || {};
  const bride = C.bride || {};
  const coupleName = `${groom.name || 'Chú rể'} & ${bride.name || 'Cô dâu'}`;
  const SLUG = slugify(`${groom.name || ''}-${bride.name || ''}`) || 'wedding';
  const TZ = /^[+-]\d{2}:\d{2}$/.test(C.timezone || '') ? C.timezone : '+07:00';
  const params = new URLSearchParams(location.search);
  const guest = (params.get('to') || params.get('khach') || '').trim().slice(0, 80);

  const album = block(C.album, 'photos');
  const story = block(C.story, 'items');
  const events = block(C.events, 'items');
  const party = block(C.party, 'members');
  const gifts = block(C.gifts, 'accounts');
  const photos = ((album && album.photos) || [])
    .map((p) => (typeof p === 'string' ? { src: p } : p)).filter((p) => p && p.src);
  const eventItems = ((events && events.items) || []).filter(Boolean);
  const accounts = ((gifts && gifts.accounts) || []).filter(Boolean);

  // "2026-12-20 10:00" → các thành phần ngày giờ (giờ địa phương của đám cưới) + Date chuẩn
  function parseLocal(str) {
    const m = String(str || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3], hh = +(m[4] || 0), mi = +(m[5] || 0);
    const date = new Date(`${y}-${pad(mo)}-${pad(d)}T${pad(hh)}:${pad(mi)}:00${TZ}`);
    return isNaN(date) ? null : { y, m: mo, d, hh, mi, date };
  }
  const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weekday = (p) => WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  /* ---------- Biểu tượng (SVG nội tuyến) ---------- */
  const HEART_D = 'M12 20.3C6.4 16.4 3.5 13.2 3.5 9.6 3.5 7 5.5 5 8 5c1.6 0 3 .8 4 2.1C13 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.6-2.9 6.8-8.5 10.7z';
  const ICONS = {
    chat: '<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.3-4.6A7.5 7.5 0 1 1 20 11.5z"/><path d="M12 14.6s-3.2-1.9-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 2.1-3.2 4-3.2 4z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.6 8 4.2C6 4.8 6.6 8 12 8zm0 0s1.5-4.4 4-3.8c2 .6 1.4 3.8-4 3.8z"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    heart: `<path d="${HEART_D}"/>`,
    volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 5m0-5-5 5"/>',
    play: '<path fill="currentColor" stroke="none" d="M8 5.5v13l11-6.5z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    images: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    facebook: '<path fill="currentColor" stroke="none" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
    tiktok: '<path fill="currentColor" stroke="none" d="M16.6 3c.4 2.2 1.8 3.7 4 4v3.1c-1.5 0-2.9-.4-4-1.2v6.3a5.7 5.7 0 1 1-5.7-5.7l.9.1v3.2a2.6 2.6 0 1 0 1.7 2.4V3h3.1z"/>',
  };
  const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  /* ---------- Ảnh ----------
     Trong config, ảnh có thể là chuỗi "assets/images/a.jpg" hoặc đối tượng
     { src, focus: "50% 30%", w, h, alt } — focus là điểm cần giữ khi ảnh bị cắt vừa khung
     (ngang% dọc%, ví dụ "50% 20%" = giữ phần trên ảnh, nơi có khuôn mặt). */
  const pic = (p) => (typeof p === 'string' ? { src: p } : (p && typeof p === 'object' ? p : {}));
  const FOCUS_RE = /^(\d{1,3}(\.\d+)?%|left|center|right)(\s+(\d{1,3}(\.\d+)?%|top|center|bottom))?$/i;
  function imgTag(p, alt, attrs = '') {
    const o = pic(p);
    if (!o.src) return '';
    const size = (o.w > 0 && o.h > 0 ? ` width="${Math.round(o.w)}" height="${Math.round(o.h)}"` : '')
      // srcset/sizes: nhiều cỡ ảnh, trình duyệt tự chọn cỡ vừa màn hình (điện thoại tải ảnh nhỏ hơn)
      + (o.srcset ? ` srcset="${esc(o.srcset)}"${o.sizes ? ` sizes="${esc(o.sizes)}"` : ''}` : '');
    const focus = String(o.focus || '').trim();
    const style = FOCUS_RE.test(focus) ? ` style="object-position:${focus}"` : '';
    return `<img class="fade-in" src="${esc(o.src)}" alt="${esc(o.alt || alt || '')}"${size}${style} ${attrs}>`;
  }

  /* ---------- Khung dựng section ---------- */
  const head = (title, sub) =>
    (title ? `<h2 class="section__title" data-reveal="up">${esc(title)}</h2>` : '') +
    (sub ? `<p class="section__sub" data-reveal="up">${esc(sub)}</p>` : '');

  function mount(id, html) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (!html) { el.hidden = true; el.innerHTML = ''; return null; }
    el.innerHTML = html;
    el.hidden = false;
    return el;
  }

  /* ---------- Ảnh bìa ---------- */
  function renderHero() {
    const h = C.hero || {};
    const d = parseLocal(C.weddingDate);
    mount('home', `
      <div class="hero__date" data-reveal="up">
        <p class="hero__we">${esc(h.before || 'Chúng tôi')}</p>
        <p class="hero__nums" aria-label="${d ? `Ngày ${d.d} tháng ${d.m}` : ''}"><span>${d ? pad(d.d) : '--'}</span><span>${d ? pad(d.m) : '--'}</span></p>
        <p class="hero__soon">${esc(h.after || 'Sắp kết hôn.')}</p>
      </div>
      ${pic(h.photo).src ? `<figure class="hero__photo" data-reveal="zoom">
        ${imgTag(h.photo, `Ảnh cưới của ${coupleName}`, 'fetchpriority="high"')}
        ${h.script !== '' ? `<span class="hero__script" aria-hidden="true">${esc(h.script || 'Wedding')}</span>` : ''}
      </figure>` : ''}
      <h1 class="hero__names" data-reveal="up">${esc(groom.name)} <small>&amp;</small> ${esc(bride.name)}</h1>
      ${guest ? `<p class="hero__guest" data-reveal="up">Trân trọng kính mời<strong>${esc(guest)}</strong>đến chung vui cùng gia đình chúng tôi</p>` : ''}`);
  }

  /* ---------- Nút nhanh dưới ảnh bìa ---------- */
  const actions = () => [
    C.wishes && ['wish', 'chat', 'Gửi lời chúc'],
    C.rsvp && ['rsvp', 'mail', 'Xác nhận tham dự'],
    accounts.length && ['gift', 'gift', 'Mừng cưới'],
  ].filter(Boolean);

  function renderQuick() {
    const list = actions();
    mount('quick', list.length ? `<div class="quick__row" style="grid-template-columns:repeat(${list.length},1fr)">
      ${list.map(([k, ic, label]) => `<button class="btn" type="button" data-open="${k}">${icon(ic)}<span>${label}</span></button>`).join('')}
    </div>` : '');
  }

  /* ---------- Video ---------- */
  function ytId(v) {
    const s = String(v || '').trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  // Ưu tiên link YouTube, sau đó tới file video (mp4); chưa có gì thì hiện khung giữ chỗ.
  // Khung video khớp tỉ lệ file (ví dụ video dọc 9:16 quay bằng điện thoại)
  function fitVideoBox(box, w, h) {
    if (!box || !(w > 0 && h > 0)) return;
    box.style.aspectRatio = `${w} / ${h}`;
    box.style.setProperty('--vr', String(w / h));
    box.classList.toggle('video--portrait', w < h);
  }
  function renderVideo() {
    const v = C.video;
    if (!v) return mount('video', '');
    const id = ytId(v.youtube);
    const file = !id && v.src ? String(v.src) : '';
    let body;
    if (file) {
      // preload="none": chỉ tải video khi khách bấm phát (không làm chậm lúc mở trang)
      body = `<video src="${esc(file)}" controls playsinline preload="none"${v.poster ? ` poster="${esc(v.poster)}"` : ''}></video>`;
    } else {
      const poster = v.poster || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : 'assets/images/video.svg');
      body = `<img src="${esc(poster)}" alt="" loading="lazy">
        <button class="video__play" type="button" data-yt="${id}" aria-label="Phát video cưới">${icon('play', 30)}</button>`;
    }
    const el = mount('video', head(v.title || 'Video Cưới', v.subtitle) + `<div class="video" data-reveal="up">${body}</div>`);
    const r = file && String(v.ratio || '').match(/^\s*(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)\s*$/);
    if (el && r) fitVideoBox($('.video', el), +r[1], +r[2]);
  }
  function playVideo(btn) {
    const id = btn.dataset.yt;
    if (!id) {
      toast({ title: 'Chưa có video', text: 'Dán link YouTube vào video.youtube (hoặc file mp4 vào video.src) trong assets/js/config.js.' });
      return;
    }
    const box = btn.closest('.video');
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Video cưới" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    Music.pause();
  }

  /* ---------- Album ---------- */
  function renderAlbum() {
    if (!photos.length) return mount('album', '');
    const n = Math.max(1, album.preview || 6);
    mount('album', head(album.title || 'Album Hình Cưới', album.subtitle) + `
      <div class="masonry">
        ${photos.slice(0, n).map((p, i) => `<button class="masonry__item" type="button" data-lb="${i}" data-reveal="up" aria-label="Xem ảnh ${i + 1}">
          ${imgTag({ ...p, src: p.thumb || p.src }, '', 'loading="lazy" decoding="async"')}</button>`).join('')}
      </div>
      <div class="center"><button class="btn" type="button" data-lb="0">${icon('images', 18)}<span>Tất cả hình ảnh (${photos.length})</span></button></div>`);
  }

  /* ---------- Lịch & đếm ngược ---------- */
  function renderDate() {
    const d = parseLocal(C.weddingDate);
    if (!d) return mount('date', '');
    const offset = (new Date(Date.UTC(d.y, d.m - 1, 1)).getUTCDay() + 6) % 7; // tuần bắt đầu từ Thứ 2
    const days = new Date(Date.UTC(d.y, d.m, 0)).getUTCDate();
    const cells = Array(offset).fill('<td></td>');
    for (let day = 1; day <= days; day++) {
      cells.push(day === d.d
        ? `<td aria-current="date"><span class="cal__day"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${HEART_D}"/></svg><span>${day}</span></span></td>`
        : `<td>${day}</td>`);
    }
    while (cells.length % 7) cells.push('<td></td>');
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);

    mount('date', `
      <div class="cal" data-reveal="up">
        <table>
          <caption>Tháng ${d.m} / ${d.y}</caption>
          <thead><tr>${['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((x) => `<th scope="col">${x}</th>`).join('')}</tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>
      <p class="date__line" data-reveal="up">${weekday(d)} · ${pad(d.d)}.${pad(d.m)}.${d.y}${C.weddingLunar ? `<br><small>${esc(C.weddingLunar)}</small>` : ''}</p>
      <div class="countdown" id="countdown" data-reveal="up">
        <div><b data-cd="d">0</b><span>Ngày</span></div>
        <div><b data-cd="h">00</b><span>Giờ</span></div>
        <div><b data-cd="m">00</b><span>Phút</span></div>
        <div><b data-cd="s">00</b><span>Giây</span></div>
      </div>
      <p class="countdown__done" id="countdown-done" hidden>Chúng mình đã về chung một nhà ♥</p>`);
    startCountdown(d.date.getTime());
  }
  function startCountdown(target) {
    const box = $('#countdown');
    const cell = (k) => $(`[data-cd="${k}"]`, box);
    const [cd, ch, cm, cs] = ['d', 'h', 'm', 's'].map(cell);
    let timer = 0;
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      const s = Math.floor(diff / 1e3);
      cd.textContent = d; ch.textContent = pad(h); cm.textContent = pad(m); cs.textContent = pad(s);
      if (target <= Date.now()) { $('#countdown-done').hidden = false; clearInterval(timer); }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- Chuyện tình yêu ---------- */
  function renderStory() {
    const items = ((story && story.items) || []).filter(Boolean);
    if (!items.length) return mount('story', '');
    mount('story', head(story.title || 'Chuyện tình yêu', story.subtitle) + `
      <div class="timeline">${items.map((it, i) => `
        <article class="tl" data-reveal="${i % 2 ? 'right' : 'left'}">
          <div class="tl__info">
            ${it.date ? `<span class="tl__date">${esc(it.date)}</span>` : ''}
            <h3 class="tl__title">${esc(it.title)}</h3>
            ${it.text ? `<p class="tl__text">${esc(it.text)}</p>` : ''}
            ${pic(it.photo).src ? `<div class="tl__img">${imgTag(it.photo, it.title, 'loading="lazy" decoding="async"')}</div>` : ''}
          </div>
        </article>`).join('')}
      </div>`);
  }

  /* ---------- Lời ngỏ ---------- */
  function renderLetter() {
    const l = C.letter;
    if (!l) return mount('letter', '');
    mount('letter', `
      <h2 class="letter__title" data-reveal="up">${esc(l.title || 'Lời Ngỏ')}</h2>
      ${l.text ? `<p class="letter__text" data-reveal="up">${esc(l.text)}</p>` : ''}
      ${pic(l.photo).src ? `<figure class="letter__photo" data-reveal="zoom">${imgTag(l.photo, coupleName, 'loading="lazy" decoding="async"')}</figure>` : ''}
      <div class="letter__sign" data-reveal="up">
        <p>*Groom/ <span>${esc(groom.name)}</span></p>
        <p>*Bride/ <span>${esc(bride.name)}</span></p>
      </div>`);
  }

  /* ---------- Sự kiện ---------- */
  const safeColor = (c) => (/^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i.test(String(c).trim()) ? String(c).trim() : 'transparent');
  const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const eventWhere = (ev) => [ev.place, ev.address].filter(Boolean).join(', ');
  const eventEnd = (ev, t) => new Date(t.date.getTime() + (Number(ev.hours) || 2) * 36e5);

  function gcalUrl(ev, t) {
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${ev.title} — ${coupleName}`,
      dates: `${utcStamp(t.date)}/${utcStamp(eventEnd(ev, t))}`,
      details: `Trân trọng kính mời bạn đến dự ${ev.title} của ${coupleName}.\n${location.href.split('#')[0]}`,
      location: eventWhere(ev),
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  }
  const enc = new TextEncoder();
  function foldIcs(line) { // RFC 5545: mỗi dòng tối đa 75 byte
    const out = [];
    let cur = '', bytes = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > 74) { out.push(cur); cur = ' '; bytes = 1; }
      cur += ch; bytes += b;
    }
    out.push(cur);
    return out.join('\r\n');
  }
  function downloadIcs(i) {
    const ev = eventItems[i];
    const t = ev && parseLocal(ev.start);
    if (!t) return;
    const e = (s) => String(s || '').replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//thiep-cuoi//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${utcStamp(t.date)}-${i}-${SLUG}@thiep-cuoi`,
      `DTSTAMP:${utcStamp(new Date())}`,
      `DTSTART:${utcStamp(t.date)}`,
      `DTEND:${utcStamp(eventEnd(ev, t))}`,
      `SUMMARY:${e(`${ev.title} — ${coupleName}`)}`,
      `LOCATION:${e(eventWhere(ev))}`,
      `DESCRIPTION:${e(`Trân trọng kính mời bạn đến dự ${ev.title} của ${coupleName}.`)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Sắp đến giờ rồi!', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].map(foldIcs).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = `${slugify(ev.title) || 'su-kien'}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function renderEvents() {
    if (!eventItems.length) return mount('events', '');
    mount('events', head(events.title || 'Sự Kiện Cưới', events.subtitle) + `
      <div class="events">${eventItems.map((ev, i) => {
        const t = parseLocal(ev.start);
        const when = t ? `${pad(t.hh)}:${pad(t.mi)} · ${weekday(t)}, ${pad(t.d)}/${pad(t.m)}/${t.y}` : esc(ev.start);
        const query = ev.address || ev.place;
        const map = ev.map || (query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '');
        const dress = (ev.dressCode || []).filter(Boolean);
        return `
        <article class="event" data-reveal="up">
          <div class="event__media">
            ${imgTag(ev.photo, ev.title, 'loading="lazy" decoding="async"')}
            ${dress.length ? `<div class="event__dress" aria-label="Dress code">${dress.map((c) => `<i style="background:${safeColor(c)}"></i>`).join('')}</div>` : ''}
          </div>
          <div class="event__body">
            <h3 class="event__title">${esc(ev.title)}</h3>
            <p class="event__time">${icon('clock', 16)}<strong>${when}</strong></p>
            ${ev.lunar ? `<p class="event__lunar">${esc(ev.lunar)}</p>` : ''}
            ${eventWhere(ev) ? `<p class="event__place">${icon('pin', 16)}<span>${ev.place ? `<b>${esc(ev.place)}</b>${ev.address ? ' – ' : ''}` : ''}${esc(ev.address)}</span></p>` : ''}
            <div class="event__actions">
              ${t ? `<details class="atc">
                <summary class="btn btn--sm">${icon('calendar', 14)}<span>Thêm vào lịch</span></summary>
                <div class="atc__menu">
                  <a href="${esc(gcalUrl(ev, t))}" target="_blank" rel="noopener">Google Calendar</a>
                  <button type="button" data-ics="${i}">iPhone / Outlook (.ics)</button>
                </div>
              </details>` : ''}
              ${map ? `<a class="btn btn--sm" href="${esc(map)}" target="_blank" rel="noopener">${icon('pin', 14)}<span>Xem bản đồ</span></a>` : ''}
            </div>
          </div>
        </article>`;
      }).join('')}
      </div>`);
  }

  /* ---------- Cô dâu & chú rể ---------- */
  function socials(s) {
    const items = Object.entries(s || {}).filter(([k, v]) => v && ICONS[k]);
    if (!items.length) return '';
    return `<ul class="socials">${items.map(([k, v]) => `<li><a href="${esc(v)}"${v === '#' ? '' : ' target="_blank" rel="noopener"'} aria-label="${k}">${icon(k, 20)}</a></li>`).join('')}</ul>`;
  }
  function member(m, role) {
    const links = socials(m.socials);
    return `
      <article class="member" data-reveal="up">
        ${pic(m.photo).src ? `<div class="member__photo">${imgTag(m.photo, m.fullName || m.name, 'loading="lazy" decoding="async"')}</div>` : ''}
        <p class="member__role">${role}</p>
        <div class="member__parents">
          ${m.father ? `<div>Con ông: <b>${esc(m.father)}</b></div>` : ''}
          ${m.mother ? `<div>Con bà: <b>${esc(m.mother)}</b></div>` : ''}
        </div>
        ${m.bio ? `<p class="member__bio">${esc(m.bio)}</p><button class="member__more" type="button" aria-expanded="false" hidden>Xem thêm</button>` : ''}
        <div class="member__foot"><span class="member__name">${esc(m.name)}${links ? ' /' : ''}</span>${links}</div>
      </article>`;
  }
  function renderCouple() {
    if (C.couple === null) return mount('couple', '');
    const c = C.couple || {};
    mount('couple', head(c.title || 'Cô Dâu & Chú Rể', c.subtitle) + member(groom, 'Chú rể') + member(bride, 'Cô dâu'));
  }
  function toggleBio(btn) {
    const p = btn.previousElementSibling;
    const open = p.classList.toggle('is-open');
    btn.textContent = open ? 'Thu gọn' : 'Xem thêm';
    btn.setAttribute('aria-expanded', String(open));
  }
  function checkClamps() {
    $$('.member__bio').forEach((p) => {
      const btn = p.nextElementSibling;
      if (!btn || p.classList.contains('is-open')) return;
      btn.hidden = p.scrollHeight <= p.clientHeight + 2;
    });
  }

  /* ---------- Phù dâu & phù rể ---------- */
  function renderParty() {
    const list = ((party && party.members) || []).filter(Boolean);
    if (!list.length) return mount('party', '');
    mount('party', head(party.title || 'Phù Dâu & Phù Rể', party.subtitle) + `
      <div class="party">${list.map((m, i) => `
        <article class="person" data-reveal="${i % 2 ? 'right' : 'left'}">
          ${pic(m.photo).src ? `<div class="person__avatar">${imgTag(m.photo, m.name, 'loading="lazy" decoding="async"')}</div>` : ''}
          <h3 class="person__name">${esc(m.name)}</h3>
          ${m.role ? `<p class="person__role">${esc(m.role)}</p>` : ''}
          ${m.bio ? `<p class="person__bio">${esc(m.bio)}</p>` : ''}
        </article>`).join('')}
      </div>`);
  }

  /* ---------- Hộp mừng cưới ---------- */
  function qrSrc(a) {
    if (a.qr) return a.qr;
    if (!a.bankId || !a.accountNumber) return '';
    const q = new URLSearchParams();
    if (a.accountName) q.set('accountName', a.accountName);
    if (a.note) q.set('addInfo', a.note);
    const acc = String(a.accountNumber).replace(/\s+/g, '');
    return `https://img.vietqr.io/image/${encodeURIComponent(a.bankId)}-${encodeURIComponent(acc)}-compact.png?${q}`;
  }
  const giftCards = (reveal) => accounts.map((a) => {
    const qr = qrSrc(a);
    return `
      <div class="gift"${reveal ? ' data-reveal="up"' : ''}>
        <strong class="gift__label">${esc(a.label)}</strong>
        ${qr ? `<img class="gift__qr" src="${esc(qr)}" alt="Mã QR chuyển khoản — ${esc(a.label)}" loading="lazy" data-fallback="assets/images/qr-placeholder.svg">` : ''}
        ${a.bank ? `<p>Ngân hàng: <b>${esc(a.bank)}</b></p>` : ''}
        ${a.accountName ? `<p>Chủ tài khoản: <b>${esc(a.accountName)}</b></p>` : ''}
        ${a.accountNumber ? `<p>Số tài khoản: <b>${esc(a.accountNumber)}</b></p>` : ''}
        ${a.branch ? `<p>Chi nhánh: <b>${esc(a.branch)}</b></p>` : ''}
        ${a.accountNumber ? `<button class="btn btn--sm" type="button" data-copy="${esc(String(a.accountNumber).replace(/\s+/g, ''))}">${icon('copy', 14)}<span>Sao chép STK</span></button>` : ''}
      </div>`;
  }).join('');
  function renderGifts() {
    if (!accounts.length) return mount('gifts', '');
    mount('gifts', head(gifts.title || 'Hộp mừng cưới', gifts.subtitle) +
      `<div class="gifts${accounts.length === 1 ? ' gifts--single' : ''}">${giftCards(true)}</div>`);
  }

  async function copyText(text, btn) {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Dự phòng cho trình duyệt cũ / mở file trực tiếp (file://)
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      (btn.closest('dialog') || document.body).appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
    }
    const label = btn.querySelector('span');
    const old = label.textContent;
    label.textContent = ok ? 'Đã sao chép ✓' : 'Không sao chép được';
    setTimeout(() => { label.textContent = old; }, 2000);
  }

  /* ---------- Lưu trữ: Google Sheets hoặc chế độ demo ---------- */
  const API = String((C.api && C.api.endpoint) || '').trim();
  const KEY_WISH = `thiep:${SLUG}:wishes`;
  const KEY_RSVP = `thiep:${SLUG}:rsvp`;
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bộ nhớ bị chặn */ } },
  };
  // Gọi Apps Script có giới hạn thời gian: kết nối bị treo thì huỷ, không để khách chờ mãi
  async function getJson(url, opts, ms) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(url, { ...opts, signal: ctl.signal });
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  const Store = {
    async wishes() {
      if (!API) {
        const samples = ((C.wishes && C.wishes.samples) || []).filter((w) => w && w.name && w.message);
        return LS.get(KEY_WISH).concat(samples);
      }
      // Chỉ đọc nên tự thử lại khi Apps Script lỗi tạm thời hoặc mạng treo
      let json;
      for (let i = 0; i < 3 && !json; i++) {
        if (i) await new Promise((r) => setTimeout(r, 1500 * i));
        try {
          json = await getJson(`${API}${API.includes('?') ? '&' : '?'}action=wishes`, { cache: 'no-store' }, 15000);
        } catch (e) { /* thử lại */ }
      }
      if (!json || !json.ok) throw new Error((json && json.error) || 'Không tải được lời chúc');
      return json.data || [];
    },
    async send(type, data) {
      if (!API) {
        const key = type === 'wish' ? KEY_WISH : KEY_RSVP;
        LS.set(key, [{ ...data, time: new Date().toISOString() }].concat(LS.get(key)).slice(0, 200));
        return { ok: true, demo: true };
      }
      let json;
      try {
        // text/plain để tránh CORS preflight với Google Apps Script
        json = await getJson(API, { method: 'POST', body: JSON.stringify({ type, ...data }) }, 25000);
      } catch (e) {
        throw new Error(e.name === 'AbortError' ? 'mạng chậm' : 'không kết nối được');
      }
      if (!json.ok) throw new Error(json.error || 'Gửi không thành công');
      return json;
    },
  };

  /* ---------- Sổ lưu bút ---------- */
  let wishes = [];
  const EMOJIS = ['❤️', '🥰', '🎉', '💐', '🥂', '💍', '🍀'];

  function wishFormHTML() {
    return `
      <form class="wish-form" data-form="wish" novalidate>
        <div class="form-row">
          <input class="field" name="name" maxlength="60" placeholder="Tên của bạn *" aria-label="Tên của bạn" autocomplete="name" required>
          <input class="field" name="email" type="email" maxlength="100" placeholder="Email (không bắt buộc)" aria-label="Email" autocomplete="email">
        </div>
        <textarea class="field" name="message" maxlength="1000" rows="4" placeholder="Lời chúc của bạn *" aria-label="Lời chúc" required></textarea>
        <div class="emoji-bar">${EMOJIS.map((e) => `<button type="button" data-emoji="${e}" aria-label="Chèn ${e}">${e}</button>`).join('')}</div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn btn--block" type="submit">Gửi lời chúc</button>
        <p class="form-msg" role="status"></p>
      </form>`;
  }
  function renderWishes() {
    const w = C.wishes;
    if (!w) return mount('wishes', '');
    mount('wishes', head(w.title || 'Sổ Lưu Bút', w.subtitle) + `
      <div data-reveal="up">${wishFormHTML()}</div>
      <div class="wish-list" id="wish-list"><p class="wish-empty">Đang tải lời chúc…</p></div>`);
  }
  function renderWishList(highlightFirst) {
    const list = $('#wish-list');
    if (!list) return;
    list.innerHTML = wishes.length
      ? wishes.map((w, i) => `
        <article class="wish${highlightFirst && i === 0 ? ' is-new' : ''}">
          <div class="wish__head"><b>${esc(w.name)}</b>${w.time ? `<time datetime="${esc(w.time)}">${fmtTime(w.time)}</time>` : ''}</div>
          <p>${esc(w.message)}</p>
        </article>`).join('')
      : '<p class="wish-empty">Hãy là người đầu tiên gửi lời chúc nhé!</p>';
  }
  async function loadWishes() {
    if (!C.wishes) return;
    try {
      wishes = await Store.wishes();
    } catch (err) {
      console.warn('[Thiệp cưới] Không tải được lời chúc:', err);
      wishes = [];
    }
    renderWishList(false);
  }
  function insertEmoji(btn) {
    const ta = btn.closest('form').elements.message;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    ta.value = ta.value.slice(0, start) + btn.dataset.emoji + ta.value.slice(end);
    const pos = start + btn.dataset.emoji.length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
  }
  function cycleWishToasts() {
    if (!C.wishes || C.wishes.toast === false) return;
    let i = 0;
    const next = () => {
      if (wishes.length && !document.hidden && !$('dialog[open]') && !$('.toast--wish')) {
        const w = wishes[i++ % wishes.length];
        toast({ title: w.name, text: w.message, icon: 'chat', timeout: 6000 }).classList.add('toast--wish');
      }
      setTimeout(next, 9000);
    };
    setTimeout(next, 5000);
  }

  /* ---------- Xác nhận tham dự ---------- */
  function rsvpFormHTML() {
    const max = Math.max(1, Number(C.rsvp.maxGuests) || 5);
    return `
      <form class="rsvp-form" data-form="rsvp" novalidate>
        <label class="lbl">Họ và tên *<input class="field" name="name" maxlength="60" autocomplete="name" required></label>
        <label class="lbl">Số điện thoại<input class="field" name="phone" type="tel" maxlength="20" autocomplete="tel"></label>
        <fieldset class="choices">
          <legend>Bạn sẽ đến chứ? *</legend>
          <div class="chips">
            <label class="chip"><input type="radio" name="attend" value="yes" checked><span>Chắc chắn rồi!</span></label>
            <label class="chip"><input type="radio" name="attend" value="no"><span>Rất tiếc, mình bận mất rồi</span></label>
          </div>
        </fieldset>
        <label class="lbl" data-guests>Số người tham dự
          <select class="field" name="guests">${Array.from({ length: max }, (_, k) => `<option value="${k + 1}">${k + 1} người</option>`).join('')}</select>
        </label>
        <fieldset class="choices">
          <legend>Bạn là khách của</legend>
          <div class="chips">
            <label class="chip"><input type="radio" name="side" value="Nhà trai" checked><span>Nhà trai</span></label>
            <label class="chip"><input type="radio" name="side" value="Nhà gái"><span>Nhà gái</span></label>
          </div>
        </fieldset>
        <label class="lbl">Lời nhắn<textarea class="field" name="note" rows="3" maxlength="500"></textarea></label>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn btn--accent btn--block" type="submit">Gửi xác nhận</button>
        <p class="form-msg" role="status"></p>
      </form>`;
  }
  function syncRsvp(form) {
    const no = form.elements.attend && form.elements.attend.value === 'no';
    const g = $('[data-guests]', form);
    if (g) g.hidden = no;
  }
  function prefill(form) {
    if (guest && form.elements.name && !form.elements.name.value) form.elements.name.value = guest;
  }

  async function onSubmit(e) {
    const form = e.target;
    if (!form.matches('form[data-form]')) return;
    e.preventDefault();
    const type = form.dataset.form;
    const msg = $('.form-msg', form);
    const say = (text, kind) => { msg.textContent = text; msg.className = `form-msg${kind ? ` is-${kind}` : ''}`; };
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = String(v).trim(); });
    if (data.website) { form.reset(); return; } // bot điền ô ẩn
    delete data.website;
    if (!data.name) { say('Bạn vui lòng nhập tên nhé.', 'error'); form.elements.name.focus(); return; }
    if (type === 'wish' && !data.message) { say('Bạn chưa viết lời chúc kìa!', 'error'); form.elements.message.focus(); return; }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) { say('Email chưa đúng định dạng.', 'error'); form.elements.email.focus(); return; }
    if (type === 'rsvp' && data.attend === 'no') data.guests = '0';

    const btn = $('[type=submit]', form);
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang gửi…';
    say('');
    try {
      const res = await Store.send(type, data);
      const dialog = form.closest('dialog');
      form.reset();
      prefill(form);
      if (type === 'rsvp') syncRsvp(form);
      if (dialog) dialog.close();
      if (type === 'wish') {
        wishes.unshift({ name: data.name, message: data.message, time: new Date().toISOString() });
        renderWishList(true);
        toast({ type: 'success', title: 'Cảm ơn bạn!', text: `Lời chúc đã được gửi tới ${coupleName} 💕` });
      } else if (data.attend === 'no') {
        toast({ type: 'success', title: 'Cảm ơn bạn đã báo tin', text: 'Tiếc quá, chúng mình sẽ nhớ bạn lắm ❤️' });
      } else {
        toast({ type: 'success', title: 'Hẹn gặp bạn nhé!', text: 'Chúng mình đã nhận được xác nhận của bạn 🥂' });
      }
      if (res && res.demo) {
        console.info('[Thiệp cưới] Chế độ demo: dữ liệu chỉ lưu trên trình duyệt này. Điền api.endpoint trong config.js để lưu vào Google Sheets.');
      }
    } catch (err) {
      say(`Chưa gửi được, bạn thử lại sau ít phút nhé. (${err.message})`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  /* ---------- Chân trang ---------- */
  function renderFooter() {
    if (C.footer === null) return mount('footer', '');
    const f = C.footer || {};
    mount('footer', `
      <h2 class="footer__title" data-reveal="up">${esc(f.title || 'Thank you!')}</h2>
      <p class="footer__sub" data-reveal="up">-- ${esc(groom.name)} &amp; ${esc(bride.name)} --</p>`);
  }

  /* ---------- Thông báo ---------- */
  function toast({ title, text, type = 'info', icon: ic, timeout = 4500 }) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <span class="toast__icon">${icon(ic || (type === 'success' ? 'check' : type === 'error' ? 'alert' : 'chat'), 16)}</span>
      <div class="toast__body">${title ? `<b>${esc(title)}</b>` : ''}${text ? `<p>${esc(text)}</p>` : ''}</div>
      <button class="toast__close" type="button" aria-label="Đóng thông báo">${icon('close', 14)}</button>`;
    const remove = () => {
      if (el.classList.contains('is-leaving')) return;
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 350);
    };
    $('.toast__close', el).addEventListener('click', remove);
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    if (timeout) setTimeout(remove, timeout);
    return el;
  }

  /* ---------- Hộp thoại ---------- */
  function renderModals() {
    const close = `<button class="icon-btn modal__close" type="button" data-close aria-label="Đóng">${icon('close')}</button>`;
    if (C.wishes) {
      $('#modal-wish').innerHTML = `${close}
        <h2 class="modal__title" id="modal-wish-title">Gửi lời chúc</h2>
        <p class="modal__sub">Đôi lời của bạn sẽ là kỷ niệm quý giá trong ngày vui của ${esc(coupleName)}.</p>
        ${wishFormHTML()}`;
    }
    if (C.rsvp) {
      $('#modal-rsvp').innerHTML = `${close}
        <h2 class="modal__title" id="modal-rsvp-title">${esc(C.rsvp.title || 'Xác nhận tham dự')}</h2>
        ${C.rsvp.subtitle ? `<p class="modal__sub">${esc(C.rsvp.subtitle)}</p>` : ''}
        ${rsvpFormHTML()}`;
    }
    if (accounts.length) {
      $('#modal-gift').innerHTML = `${close}
        <h2 class="modal__title" id="modal-gift-title">${esc(gifts.title || 'Mừng cưới')}</h2>
        ${gifts.subtitle ? `<p class="modal__sub">${esc(gifts.subtitle)}</p>` : ''}
        <div class="gifts${accounts.length === 1 ? ' gifts--single' : ''}">${giftCards(false)}</div>`;
    }
    $$('dialog.modal').forEach((d) => {
      d.addEventListener('close', onDialogClose);
      d.addEventListener('click', (e) => { // bấm ra ngoài hộp thoại để đóng
        if (e.target !== d) return;
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
      });
    });
  }
  function onDialogClose() {
    if (!$('dialog[open]')) document.documentElement.classList.remove('modal-open');
  }
  function openModal(name) {
    const d = document.getElementById(`modal-${name}`);
    if (!d || d.open || !d.innerHTML.trim()) return;
    closeDrawer();
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    document.documentElement.classList.add('modal-open');
  }

  /* ---------- Xem ảnh lớn ---------- */
  const Lightbox = (() => {
    const box = $('#lightbox');
    let idx = 0, startX = null, swiped = false;
    box.innerHTML = `
      <img class="lightbox__img" alt="">
      <p class="lightbox__count" aria-live="polite"></p>
      <button class="lightbox__btn lightbox__close" type="button" data-close aria-label="Đóng">${icon('close', 22)}</button>
      <button class="lightbox__btn lightbox__prev" type="button" aria-label="Ảnh trước">${icon('left', 24)}</button>
      <button class="lightbox__btn lightbox__next" type="button" aria-label="Ảnh sau">${icon('right', 24)}</button>`;
    const imgEl = $('.lightbox__img', box);
    const countEl = $('.lightbox__count', box);
    const show = (n) => {
      idx = (n + photos.length) % photos.length;
      const p = photos[idx];
      imgEl.style.animation = 'none';
      void imgEl.offsetWidth; // chạy lại hiệu ứng mờ dần
      imgEl.style.animation = '';
      imgEl.src = p.src;
      imgEl.alt = p.alt || `Ảnh ${idx + 1}`;
      countEl.textContent = `${idx + 1} / ${photos.length}`;
      [idx + 1, idx - 1].forEach((j) => { new Image().src = photos[(j + photos.length) % photos.length].src; });
    };
    $('.lightbox__prev', box).addEventListener('click', () => show(idx - 1));
    $('.lightbox__next', box).addEventListener('click', () => show(idx + 1));
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    box.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    box.addEventListener('pointerup', (e) => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50 && photos.length > 1) {
        show(idx + (dx < 0 ? 1 : -1));
        swiped = true;
        setTimeout(() => { swiped = false; }, 60);
      }
    });
    box.addEventListener('click', (e) => { if (e.target === box && !swiped) box.close(); });
    box.addEventListener('close', onDialogClose);
    return {
      open(n) {
        if (!photos.length) return;
        box.classList.toggle('is-single', photos.length < 2);
        $$('.lightbox__prev, .lightbox__next', box).forEach((b) => { b.hidden = photos.length < 2; });
        show(n || 0);
        if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
        document.documentElement.classList.add('modal-open');
      },
    };
  })();

  /* ---------- Nút nổi ---------- */
  function renderFab() {
    const fab = $('#fab');
    const list = actions();
    if (!list.length) { fab.remove(); return; }
    fab.innerHTML = `
      <div class="fab__items" id="fab-items">
        ${list.map(([k, ic, label], i) => `<button class="fab__btn${k === 'rsvp' ? ' shake' : ''}${i === 0 ? ' is-peek' : ''}" type="button" data-open="${k}" aria-label="${label}">
          <span class="fab__label" aria-hidden="true">${label}</span>${icon(ic)}</button>`).join('')}
      </div>
      <button class="fab__btn fab__toggle" type="button" aria-controls="fab-items" aria-expanded="true" aria-label="Thu gọn">${icon('close')}</button>`;
    setTimeout(() => $$('.is-peek', fab).forEach((b) => b.classList.remove('is-peek')), 8000);
    const toggle = $('.fab__toggle', fab);
    toggle.addEventListener('click', () => {
      const collapsed = fab.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Mở menu' : 'Thu gọn');
      toggle.innerHTML = icon(collapsed ? 'heart' : 'close');
    });
  }

  /* ---------- Nhạc nền ---------- */
  let Music = { pause() {} };
  function setupMusic() {
    const m = C.music;
    const el = $('#player');
    if (!m || !m.src) { el.remove(); return; }
    el.hidden = false;
    el.innerHTML = `
      <button class="player__btn" type="button" aria-pressed="false" aria-label="Bật nhạc nền">${icon('mute')}</button>
      <button class="player__hint" type="button">Chạm vào đây để nghe nhạc nền nhé!</button>`;
    const btn = $('.player__btn', el);
    const hint = $('.player__hint', el);
    const audio = new Audio();
    audio.preload = 'none'; // đặt trước src để trình duyệt không tải nhạc khi chưa cần
    audio.loop = true;
    audio.src = m.src;
    audio.volume = typeof m.volume === 'number' ? m.volume : 0.7;
    let wanted = false, broken = false, askedAt = 0;
    let started = false, userOff = false, stopWaiting = () => {};

    const ui = (on) => {
      el.classList.toggle('is-playing', on);
      btn.innerHTML = icon(on ? 'volume' : 'mute');
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
      if (on) hint.hidden = true;
    };
    const warn = () => toast({ type: 'error', title: 'Chưa phát được nhạc', text: `Không mở được file "${m.src}". Hãy chép file mp3 vào thư mục assets/music/.` });
    const play = (byUser) => {
      if (byUser) { askedAt = Date.now(); userOff = false; }
      if (broken) { if (byUser) warn(); return; }
      wanted = true;
      const p = audio.play();
      if (p && p.then) {
        p.then(() => { started = true; ui(true); stopWaiting(); })
          // Bị trình duyệt chặn. Nếu một lần phát khác đã chạy được thì giữ nguyên
          .catch(() => { if (audio.paused) { wanted = false; ui(false); } });
      }
    };
    const pause = (byUser) => { wanted = false; if (byUser === true) userOff = true; audio.pause(); ui(false); };
    audio.addEventListener('error', () => {
      broken = true;
      wanted = false;
      ui(false);
      if (Date.now() - askedAt < 5000) warn();
    });
    btn.addEventListener('click', () => (wanted ? pause(true) : play(true)));
    hint.addEventListener('click', () => play(true));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) audio.pause();
      else if (wanted && !broken) audio.play().catch(() => {});
    });
    // Khách xem video thì tắt nhạc và thôi tự bật lại
    Music = { pause: () => { stopWaiting(); pause(); } };

    // Tự phát nhạc khi mở thiệp. Đa số trình duyệt (nhất là trên điện thoại) chặn phát nhạc
    // khi khách chưa chạm vào trang: khi đó nhạc bắt đầu ở lần chạm/bấm đầu tiên.
    if (m.autoplay !== false) {
      const evs = ['click', 'touchend', 'keydown'];
      const tryNow = () => { if (!started && !userOff && !document.hidden) play(false); };
      function kick(e) {
        const t = e.target;
        // Nút loa và video tự lo phần nhạc
        if (t && t.closest && t.closest('#player, [data-yt], video')) return;
        tryNow();
      }
      stopWaiting = () => {
        evs.forEach((t) => document.removeEventListener(t, kick, true));
        document.removeEventListener('visibilitychange', tryNow);
      };
      evs.forEach((t) => document.addEventListener(t, kick, true));
      document.addEventListener('visibilitychange', tryNow);
      // Đợi trang tải xong ảnh bìa rồi mới tải nhạc
      if (document.readyState === 'complete') tryNow();
      else addEventListener('load', tryNow, { once: true });
    }
  }

  /* ---------- Hiệu ứng rơi ---------- */
  function setupFx() {
    const cv = $('#fx');
    const type = C.effect || 'snow';
    if (!cv || type === 'none' || !cv.getContext || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (cv) cv.remove();
      return;
    }
    const ctx = cv.getContext('2d');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#df4758';
    const heart = typeof Path2D === 'function' ? new Path2D(HEART_D) : null;
    const snow = type === 'snow';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const PETALS = ['#f2c4cb', '#eab0ba', '#f7d9dc', '#e59aa8'];
    let W = 0, H = 0, raf = 0, last = 0;
    const parts = [];
    const spawn = (p, top) => Object.assign(p, {
      c: PETALS[Math.floor(Math.random() * PETALS.length)],
      x: rnd(0, W),
      y: top ? rnd(-40, -10) : rnd(0, H),
      r: snow ? rnd(1.2, 3.4) : rnd(6, 12),
      vy: snow ? rnd(18, 55) : rnd(25, 60),
      vx: rnd(-10, 10),
      sway: rnd(0.6, 1.6),
      phase: rnd(0, Math.PI * 2),
      rot: rnd(0, Math.PI * 2),
      vr: rnd(-1, 1),
      a: snow ? rnd(0.55, 0.95) : rnd(0.4, 0.8),
    });
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(snow ? 70 : 26, (W * H) / (snow ? 16000 : 38000)));
      while (parts.length < n) parts.push(spawn({}, false));
      parts.length = n;
    }
    function draw(p) {
      ctx.globalAlpha = p.a;
      if (snow) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(0,0,0,.08)';
        ctx.stroke();
      } else if (type === 'hearts' && heart) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.phase) * 0.5);
        ctx.scale(p.r / 12, p.r / 12);
        ctx.translate(-12, -12);
        ctx.fillStyle = accent;
        ctx.fill(heart);
        ctx.restore();
      } else {
        // cánh hoa có khía ở đầu, lật nhẹ khi bay
        const r = p.r;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(Math.max(0.3, Math.abs(Math.cos(p.phase * 1.3))), 1);
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(r * 0.95, r * 0.45, r * 0.8, -r * 0.85, 0, -r * 0.55);
        ctx.bezierCurveTo(-r * 0.8, -r * 0.85, -r * 0.95, r * 0.45, 0, r);
        ctx.fillStyle = p.c;
        ctx.fill();
        ctx.restore();
      }
    }
    function frame(t) {
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.phase += dt * p.sway;
        p.rot += dt * p.vr;
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(p.phase) * 15) * dt;
        if (p.y > H + 20 || p.x < -30 || p.x > W + 30) spawn(p, true);
        draw(p);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    resize();
    addEventListener('resize', debounce(resize, 200));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    });
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Thanh trên & mục lục ---------- */
  let closeDrawer = () => {};
  function setupNav() {
    const bar = $('#topbar');
    const drawer = $('#drawer');
    const backdrop = $('#backdrop');
    const menuBtn = $('#menu-btn');
    $('#brand').textContent = coupleName;
    $('#drawer-title').textContent = coupleName;
    menuBtn.innerHTML = icon('menu', 22);
    $('#drawer-close').innerHTML = icon('close', 20);
    const labels = {
      home: 'Trang chủ', video: 'Video cưới', album: 'Album ảnh', date: 'Ngày cưới', story: 'Chuyện tình yêu',
      letter: 'Lời ngỏ', events: 'Sự kiện cưới', couple: 'Cô dâu & Chú rể', party: 'Phù dâu & Phù rể',
      gifts: 'Hộp mừng cưới', wishes: 'Sổ lưu bút',
    };
    $('#drawer-links').innerHTML = $$('#app > section')
      .filter((s) => !s.hidden && labels[s.id])
      .map((s) => `<li><a href="#${s.id}">${labels[s.id]}</a></li>`).join('');

    const open = () => {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      const first = $('a', drawer);
      if (first) first.focus({ preventScroll: true });
    };
    closeDrawer = () => {
      if (!drawer.classList.contains('is-open')) return;
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', open);
    backdrop.addEventListener('click', closeDrawer);
    $('#drawer-close').addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

    const hero = $('#home');
    let ticking = false;
    const update = () => {
      ticking = false;
      const show = scrollY > Math.max(200, hero.offsetHeight - 80);
      bar.classList.toggle('is-visible', show);
      document.body.classList.toggle('has-topbar', show);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Hiện dần khi cuộn ---------- */
  function setupReveal() {
    const els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.08 }); // không thu hẹp mép dưới, để phần cuối trang vẫn hiện được
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Xen kẽ màu nền các phần ---------- */
  function stripe() {
    let i = 0;
    $$('#app > .section').forEach((s) => {
      if (s.hidden) return;
      s.classList.toggle('section--alt', i % 2 === 0);
      i++;
    });
  }

  /* ---------- Sự kiện chung ---------- */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', (e) => {
    const t = e.target;
    $$('details.atc[open]').forEach((d) => { if (!d.contains(t)) d.open = false; });
    const hit = (sel) => t.closest(sel);
    let el;
    if ((el = hit('a[href^="#"]'))) {
      e.preventDefault(); // link "#" (chưa điền) thì không làm gì
      const target = document.getElementById(el.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    else if ((el = hit('[data-open]'))) { e.preventDefault(); openModal(el.dataset.open); }
    else if ((el = hit('[data-lb]'))) Lightbox.open(Number(el.dataset.lb));
    else if ((el = hit('[data-copy]'))) copyText(el.dataset.copy, el);
    else if ((el = hit('[data-ics]'))) { downloadIcs(Number(el.dataset.ics)); el.closest('details').open = false; }
    else if ((el = hit('[data-yt]'))) playVideo(el);
    else if ((el = hit('.member__more'))) toggleBio(el);
    else if ((el = hit('[data-emoji]'))) insertEmoji(el);
    else if ((el = hit('[data-close]'))) { const d = el.closest('dialog'); if (d) d.close(); }
  });
  document.addEventListener('submit', onSubmit);
  // Khách bấm phát video (file mp4) thì tạm dừng nhạc nền
  document.addEventListener('play', (e) => { if (e.target.tagName === 'VIDEO') Music.pause(); }, true);
  // Chưa khai báo ratio trong config → tự đo tỉ lệ khi video tải xong thông tin
  document.addEventListener('loadedmetadata', (e) => {
    const vid = e.target, box = vid.parentElement;
    if (vid.tagName === 'VIDEO' && box && box.classList.contains('video') && !box.style.aspectRatio) fitVideoBox(box, vid.videoWidth, vid.videoHeight);
  }, true);
  document.addEventListener('change', (e) => {
    const f = e.target.closest('form[data-form="rsvp"]');
    if (f) syncRsvp(f);
  });
  // Ảnh lỗi (ví dụ mã QR không tải được) → dùng ảnh dự phòng
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.fallback && !img.src.endsWith(img.dataset.fallback)) img.src = img.dataset.fallback;
  }, true);
  // Ảnh hiện dần khi tải xong (cả khi lỗi, để ảnh không bị ẩn mãi)
  const showImg = (e) => { const t = e.target; if (t.tagName === 'IMG' && t.classList.contains('fade-in')) t.classList.add('is-loaded'); };
  document.addEventListener('load', showImg, true);
  document.addEventListener('error', showImg, true);

  /* ---------- Khởi động ---------- */
  const safe = (fn) => { try { fn(); } catch (err) { console.error(`[Thiệp cưới] Lỗi ở ${fn.name}:`, err); } };
  [renderHero, renderQuick, renderVideo, renderAlbum, renderDate, renderStory, renderLetter, renderEvents,
    renderCouple, renderParty, renderGifts, renderWishes, renderFooter, renderModals, renderFab].forEach(safe);
  stripe();
  $$('img.fade-in').forEach((img) => { if (img.complete) img.classList.add('is-loaded'); });
  [setupNav, setupReveal, setupMusic, setupFx].forEach(safe);
  $$('form[data-form]').forEach((f) => { prefill(f); if (f.dataset.form === 'rsvp') syncRsvp(f); });
  loadWishes();
  cycleWishToasts();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkClamps); else checkClamps();
  addEventListener('resize', debounce(checkClamps, 200));
})();

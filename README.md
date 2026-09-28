# Thiệp cưới online

Website thiệp cưới một trang, giao diện một cột theo phong cách mẫu **M-135** của iWedding (Biihappy).
Toàn bộ mã nguồn được viết lại từ đầu — không dùng mã, hình ảnh hay nội dung của Biihappy.
Ảnh trong dự án là ảnh giữ chỗ, bạn thay bằng ảnh cưới của mình.

Không cần cài đặt, không cần build, không dùng thư viện: chỉ HTML + CSS + JavaScript.

## Tính năng

- Ảnh bìa với ngày/tháng cưới, chữ “Wedding” bay bướm, tên cô dâu chú rể
- **Link mời riêng từng khách**: `.../?to=Anh Tuấn & Chị Mai` → thiệp hiện “Trân trọng kính mời Anh Tuấn & Chị Mai”, tên tự điền sẵn vào form
- Nút nhanh + nút nổi góc phải: Gửi lời chúc · Xác nhận tham dự · Mừng cưới
- Video cưới: YouTube (chỉ tải khi khách bấm phát) hoặc file mp4, tự tắt nhạc nền khi phát video
- Album ảnh dạng lưới so le + xem ảnh lớn (vuốt, phím mũi tên)
- Lịch tháng cưới đánh dấu trái tim + đồng hồ đếm ngược
- Chuyện tình yêu dạng timeline zig-zag
- Lời ngỏ có chữ ký cô dâu chú rể
- Sự kiện cưới: giờ, địa điểm, ngày âm lịch, dress code, **Thêm vào lịch** (Google Calendar / file .ics cho iPhone, Outlook), **Xem bản đồ**
- Cô dâu & chú rể (tên bố mẹ, giới thiệu, mạng xã hội), phù dâu & phù rể
- Hộp mừng cưới: **mã QR VietQR tự tạo** từ số tài khoản, nút sao chép số tài khoản
- Sổ lưu bút, lời chúc hiện lần lượt ở góc màn hình
- Nhạc nền, hiệu ứng tuyết / trái tim / cánh hoa rơi
- Lưu lời chúc & xác nhận tham dự vào **Google Sheets** (miễn phí)
- Tối ưu cho điện thoại

## Cấu trúc thư mục

```
index.html                 Khung trang (tiêu đề, ảnh chia sẻ, thứ tự các phần)
tao-link.html              Công cụ tạo link mời riêng cho danh sách khách
assets/
  js/config.js             ★ NỘI DUNG THIỆP — file duy nhất cần sửa
  js/app.js                Mã dựng trang & tương tác
  css/style.css            Giao diện (màu, font ở đầu file)
  images/                  Ảnh (đang là ảnh giữ chỗ .svg)
  music/                   Nhạc nền (tự thêm file mp3)
  video/                   Video cưới nếu không dùng YouTube (tự thêm file mp4)
google-apps-script/Code.gs Backend Google Sheets cho lời chúc & xác nhận
tools/anh.py               Công cụ xem nhanh & tối ưu ảnh cưới cho web (xuất WebP/JPEG)
tools/chon-anh.json        Danh sách ảnh đã chọn cho từng vị trí (chạy lại được bằng anh.py)
tools/serve.py             Máy chủ xem thử trên máy (không lưu bộ nhớ đệm)
```

## Xem thử trên máy

- Cách nhanh nhất: bấm đúp mở `index.html` bằng Chrome/Edge.
- Hoặc chạy máy chủ tĩnh trong thư mục dự án rồi mở http://localhost:5500 :

  ```bash
  python tools/serve.py
  ```

- Máy chủ này tắt bộ nhớ đệm, sửa file xong chỉ cần **F5**. Nếu mở thẳng file `index.html` thì nhấn **Ctrl + F5**.

## Tốc độ tải

- Lúc mở trang chỉ tải khoảng 0,4 MB: ảnh bìa (bản nhỏ cho điện thoại), ảnh bìa video, font chữ và code.
- Ảnh album, chuyện tình yêu, sự kiện… tải dần khi khách cuộn tới; video chỉ tải khi bấm phát.
- Ảnh dùng định dạng WebP (nhẹ hơn JPEG ~30–50%). Ảnh chia sẻ link `og-cover.jpg` giữ JPEG cho Zalo/Facebook.
- Khi đưa lên GitHub Pages / Netlify, code còn được nén tự động và phục vụ qua CDN nên càng nhanh.

## Thay nội dung

Mở `assets/js/config.js` và sửa trực tiếp — mỗi mục đều có chú thích tiếng Việt.

| Mục | Nội dung |
| --- | --- |
| `groom`, `bride` | Tên, tên bố mẹ, ảnh, giới thiệu, link Facebook/Instagram/TikTok |
| `weddingDate` | Ngày giờ cưới chính, dạng `"2026-12-20 10:00"` (dùng cho ảnh bìa, lịch, đếm ngược) |
| `hero` | Ảnh bìa và dòng chữ quanh ngày cưới |
| `music`, `effect` | Nhạc nền; hiệu ứng `"snow"`, `"hearts"`, `"petals"` hoặc `"none"` |
| `video` | Link YouTube (`youtube`) hoặc file mp4 (`src`); chưa điền thì hiện khung giữ chỗ, `video: null` để ẩn |
| `album` | Danh sách ảnh; `preview` = số ảnh hiện sẵn |
| `story` | Các cột mốc chuyện tình yêu |
| `letter` | Lời ngỏ (xuống dòng bằng `\n`) |
| `events` | Các sự kiện: tên, giờ, địa điểm, địa chỉ, link bản đồ, âm lịch, dress code |
| `party` | Phù dâu, phù rể |
| `gifts` | Tài khoản mừng cưới |
| `wishes` | Tiêu đề sổ lưu bút, lời chúc mẫu |
| `rsvp` | Hộp thoại xác nhận tham dự (`null` để tắt) |
| `api.endpoint` | Link Google Apps Script để lưu dữ liệu thật |

Muốn **ẩn một phần**, đặt giá trị của nó là `null` (ví dụ `party: null`).
Muốn **đổi thứ tự các phần**, đổi thứ tự các thẻ `<section>` trong `index.html`.
Muốn **đổi màu/font**, sửa khối `:root` ở đầu `assets/css/style.css`.

### Ảnh

Chép ảnh vào `assets/images/` rồi đổi đường dẫn trong `config.js`, ví dụ `photo: "assets/images/anh-bia.jpg"`.
Khi ảnh bị cắt vừa khung (tròn, oval, vuông) mà mất đầu người, thêm điểm giữ lại:
`photo: { src: "assets/images/anh-bia.jpg", focus: "50% 25%" }` (ngang% dọc%).

Nên xử lý ảnh bằng công cụ có sẵn `tools/anh.py` (cần Python + Pillow): xoay đúng chiều, chuyển màu chuẩn sRGB,
thu nhỏ, nén và **xoá thông tin EXIF/vị trí GPS** trước khi đưa lên mạng:

```bash
python tools/anh.py xem "D:/Anh cuoi"
```

```bash
python tools/anh.py xuat tools/chon-anh.json
```

Lệnh `xem` tạo bảng ảnh đánh số để chọn; lệnh `xuat` xuất các ảnh đã chọn theo file JSON (xem hướng dẫn ở đầu `tools/anh.py`).
Không dùng Python thì có thể nén bằng https://squoosh.app: ảnh bìa ~1200px chiều ngang, ảnh album ~1600px, mỗi ảnh dưới 400 KB.

| Vị trí | Tỉ lệ gợi ý |
| --- | --- |
| Ảnh bìa | dọc 2:3 |
| Album | tuỳ ý (lưới tự xếp theo tỉ lệ ảnh) |
| Chuyện tình yêu, phù dâu/phù rể, sự kiện | vuông 1:1 |
| Lời ngỏ | dọc 5:7 |
| Cô dâu, chú rể | dọc 3:4 (hiển thị khung oval) |

### Nhạc nền

Chép file mp3 vào `assets/music/nhac-nen.mp3`. Trình duyệt chặn tự phát nhạc, nên nhạc sẽ bắt đầu ở lần chạm/bấm đầu tiên của khách (`autoplay: true`) hoặc khi khách bấm nút loa.

### Video cưới

Tải video lên YouTube (có thể để chế độ **Không công khai**), rồi dán link vào `video.youtube`.
Nếu không muốn dùng YouTube, chép file vào `assets/video/` và điền `video.src: "assets/video/phim-cuoi.mp4"` — nên nén dưới khoảng 50 MB để thiệp mở nhanh.
Đặt tên file không dấu, không khoảng trắng. Video dọc (quay điện thoại) thì thêm `ratio: "9/16"` để khung hiển thị dọc; thêm `poster` là ảnh hiện trước khi bấm phát (iPhone cần ảnh này, nếu không sẽ hiện khung đen).

### Mã QR mừng cưới

Điền `bankId` (mã BIN ngân hàng, danh sách trong `config.js`), `accountNumber` và `accountName` — mã QR được tạo tự động qua VietQR, quét bằng mọi app ngân hàng.
Hãy tự quét thử mã QR trước khi gửi thiệp. Nếu muốn dùng ảnh QR chụp từ app ngân hàng, đặt đường dẫn ảnh vào `qr`.

## Link mời riêng từng khách

Thêm `?to=` + tên khách vào cuối địa chỉ thiệp:

```
https://ten-mien-cua-ban.com/?to=Anh Tuấn & Chị Mai
```

Có nhiều khách? Mở `tao-link.html`, dán danh sách tên (mỗi dòng một người) → sao chép từng tin nhắn mời hoặc tải file CSV.

## Lưu lời chúc & xác nhận vào Google Sheets

Khi `api.endpoint` để trống, trang chạy ở **chế độ demo**: lời chúc và xác nhận chỉ lưu trên trình duyệt của người gửi, bạn **không nhận được** dữ liệu. Để nhận dữ liệu thật:

1. Tạo một Google Sheet mới (ví dụ “Thiệp cưới”).
2. Menu **Tiện ích mở rộng → Apps Script**. Xoá code mẫu, dán toàn bộ nội dung `google-apps-script/Code.gs`, bấm **Lưu**.
3. Bấm **Triển khai → Tùy chọn triển khai mới**, chọn loại **Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
4. Bấm **Triển khai**, cấp quyền cho tài khoản Google của bạn, sao chép **URL ứng dụng web** (kết thúc bằng `/exec`).
5. Dán URL vào `config.js`:

   ```js
   api: { endpoint: "https://script.google.com/macros/s/XXXXXXXX/exec" }
   ```

Lời chúc vào trang tính `LoiChuc`, xác nhận tham dự vào `XacNhan` (tự tạo ở lần gửi đầu tiên).
Muốn ẩn một lời chúc không phù hợp: đổi ô cột **Hiển thị** của dòng đó thành `FALSE`.
Nếu sửa `Code.gs`, cần **Triển khai → Quản lý các lượt triển khai → Chỉnh sửa → Phiên bản mới** thì thay đổi mới có hiệu lực.

## Đưa lên mạng (miễn phí)

- **Netlify Drop** (dễ nhất): vào https://app.netlify.com/drop, kéo thả cả thư mục dự án → có ngay đường link.
- **GitHub Pages**: tạo repository, tải toàn bộ file lên, vào **Settings → Pages**, chọn nhánh `main` → trang có địa chỉ dạng `https://ten-ban.github.io/ten-repo/`.
- **Vercel** / **Cloudflare Pages**: nhập repository, không cần lệnh build.

Sau khi có địa chỉ thật:

- Sửa `<title>`, `description`, `og:title`, `og:description` trong `index.html`.
- Thêm ảnh chia sẻ `assets/images/og-cover.jpg` (khoảng 1200×630) và bỏ chú thích dòng `og:image` với **đường dẫn đầy đủ**, để khi gửi link qua Zalo/Facebook hiện ảnh đẹp.
- Mở `tao-link.html` trên trang thật để tạo link mời.

## Ghi chú

- Font chữ tải từ Google Fonts (Bonheur Royale, Great Vibes, Bellota Text), cần có mạng.
- Chỉ dùng ảnh và nhạc bạn có quyền sử dụng.

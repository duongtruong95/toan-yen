/* =====================================================================
   CẤU HÌNH THIỆP CƯỚI — chỉ cần sửa file này.
   - Chuỗi chữ đặt trong dấu nháy "...", các mục cách nhau bằng dấu phẩy.
   - Muốn ẩn một phần: xoá hẳn khối đó hoặc đặt = null (ví dụ: video: null).
   - Ảnh: chép ảnh vào assets/images/ rồi đổi đường dẫn tương ứng.
     Mỗi ảnh viết dạng chuỗi "assets/images/a.jpg" hoặc dạng đầy đủ:
       { src: "assets/images/a.jpg", focus: "50% 25%", w: 1067, h: 1600 }
     focus = điểm giữ lại khi ảnh bị cắt vừa khung (ngang% dọc%); "50% 25%" giữ phần trên ảnh.
     w, h = kích thước ảnh, giúp trang không bị nhảy khi ảnh đang tải.
   ===================================================================== */
window.WEDDING = {
  /* ---------- Cô dâu & chú rể ---------- */
  groom: {
    name: "Văn Toàn",                   // tên ngắn, hiển thị khắp trang (theo thiệp)
    fullName: "Ninh Văn Toàn",
    father: "Ninh Văn Chánh",           // "Con ông"
    mother: "Ninh Thị Hương",           // "Con bà"
    photo: "assets/images/cuoi/chu-re.webp",
    bio: "Hiền lành, điềm đạm và chu đáo. Anh ít nói nhưng luôn quan tâm bằng những việc làm nhỏ, sống có trách nhiệm và hết lòng vì gia đình. Với anh, gia đình là nơi bình yên nhất để trở về.",
    socials: {}  // muốn hiện biểu tượng: { facebook: "https://facebook.com/...", instagram: "https://instagram.com/..." }
  },
  bride: {
    name: "Nguyễn Yến",
    fullName: "Nguyễn Thị Yến",
    father: "Nguyễn Văn Quyền",
    mother: "Đào Thị Hải",
    photo: "assets/images/cuoi/co-dau.webp",
    bio: "Dịu dàng, hay cười và giàu tình cảm. Cô luôn biết lắng nghe, quan tâm đến mọi người xung quanh và mang lại cảm giác ấm áp cho những ai ở bên. Với cô, hạnh phúc là những điều giản dị được vun đắp mỗi ngày.",
    socials: {}
  },

  /* ---------- Ngày cưới chính (dùng cho ảnh bìa, lịch, đếm ngược) ----------
     Định dạng: "NĂM-THÁNG-NGÀY GIỜ:PHÚT" theo giờ Việt Nam. */
  weddingDate: "2026-10-20 09:00",
  weddingLunar: "Tức ngày 11 tháng 09 năm Bính Ngọ",
  timezone: "+07:00",

  /* ---------- Ảnh bìa ---------- */
  hero: {
    photo: { src: "assets/images/cuoi/anh-bia.webp", w: 1200, h: 1800, srcset: "assets/images/cuoi/anh-bia-800.webp 800w, assets/images/cuoi/anh-bia.webp 1200w", sizes: "(max-width: 575px) calc(100vw - 32px), 543px" },
    before: "Chúng tôi",
    after: "Sắp kết hôn.",
    script: "Wedding"                   // chữ bay bướm đè lên chân ảnh bìa
  },

  /* ---------- Nhạc nền ----------
     Chép file mp3 vào assets/music/ rồi sửa src. autoplay: true = tự phát khi mở thiệp;
     trình duyệt nào chặn (đa số điện thoại) thì phát ở lần chạm đầu tiên của khách. */
  music: {
    src: "assets/music/nhac-nen.mp3", // Hơn Cả Yêu — Đức Phúc
    autoplay: true
  },

  /* Hiệu ứng rơi: "snow" (tuyết) | "hearts" (trái tim) | "petals" (cánh hoa) | "none" */
  effect: "snow",

  /* ---------- Video cưới ----------
     youtube: dán link YouTube, ví dụ "https://www.youtube.com/watch?v=xxxxxxxxxxx" (khuyên dùng)
     src: hoặc dùng file video trong dự án, ví dụ "assets/video/phim-cuoi.mp4"
     poster: ảnh hiện trước khi bấm phát (tuỳ chọn; YouTube tự lấy ảnh của video)
     ratio: tỉ lệ khung của file video, ví dụ "9/16" (video dọc) — bỏ trống thì tự đo
     Chưa điền link thì hiện khung giữ chỗ. Không muốn có phần này: đặt video: null */
  video: {
    title: "Video Cưới",
    subtitle: "Những thước phim ghi lại hành trình yêu thương của chúng mình.",
    youtube: "",
    src: "assets/video/mo-rem-319.mp4",   // video mở rèm, dọc 1440×2560, 20 giây
    poster: "assets/images/video-poster.webp",
    ratio: "9/16"
  },

  /* ---------- Album ảnh ---------- */
  album: {
    title: "Album Hình Cưới",
    subtitle: "Mỗi bức ảnh là một lát cắt hạnh phúc mà chúng mình muốn giữ mãi.",
    preview: 6,                         // số ảnh hiện sẵn; bấm "Tất cả hình ảnh" để xem hết
    // src: ảnh lớn khi bấm xem · thumb: ảnh nhỏ trong lưới · w, h: kích thước ảnh nhỏ
    photos: [
      { src: "assets/images/cuoi/album/01.webp", thumb: "assets/images/cuoi/album/nho/01.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/02.webp", thumb: "assets/images/cuoi/album/nho/02.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/03.webp", thumb: "assets/images/cuoi/album/nho/03.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/04.webp", thumb: "assets/images/cuoi/album/nho/04.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/05.webp", thumb: "assets/images/cuoi/album/nho/05.webp", w: 800, h: 534 },
      { src: "assets/images/cuoi/album/06.webp", thumb: "assets/images/cuoi/album/nho/06.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/07.webp", thumb: "assets/images/cuoi/album/nho/07.webp", w: 800, h: 534 },
      { src: "assets/images/cuoi/album/08.webp", thumb: "assets/images/cuoi/album/nho/08.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/09.webp", thumb: "assets/images/cuoi/album/nho/09.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/10.webp", thumb: "assets/images/cuoi/album/nho/10.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/11.webp", thumb: "assets/images/cuoi/album/nho/11.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/12.webp", thumb: "assets/images/cuoi/album/nho/12.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/13.webp", thumb: "assets/images/cuoi/album/nho/13.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/14.webp", thumb: "assets/images/cuoi/album/nho/14.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/15.webp", thumb: "assets/images/cuoi/album/nho/15.webp", w: 534, h: 800 },
      { src: "assets/images/cuoi/album/16.webp", thumb: "assets/images/cuoi/album/nho/16.webp", w: 534, h: 800 }
    ]
  },

  /* ---------- Chuyện tình yêu ---------- */
  story: {
    title: "Chuyện tình yêu",
    subtitle: "Từ hai người xa lạ, chúng mình đã cùng nhau đi qua bao mùa thương nhớ.",
    items: [
      {
        date: "Tháng 3, 2019",
        title: "Lần đầu gặp gỡ",
        text: "Một buổi chiều mưa ở thư viện trường, hai đứa cùng với tay lấy một cuốn sách. Anh nhường, em cười — và câu chuyện bắt đầu từ một lời cảm ơn rất khẽ.",
        photo: { src: "assets/images/cuoi/chuyen-1.webp", focus: "50% 12%" }
      },
      {
        date: "Tháng 8, 2019",
        title: "Buổi hẹn đầu tiên",
        text: "Quán cà phê nhỏ đầu ngõ, ly nâu đá tan gần hết mà chuyện vẫn chưa dứt. Hôm ấy anh đưa em về dưới trời đầy sao, và cả hai đều biết đây sẽ không phải lần cuối.",
        photo: { src: "assets/images/cuoi/chuyen-2.webp", focus: "50% 15%" }
      },
      {
        date: "Tháng 2, 2025",
        title: "Lời cầu hôn",
        text: "Trên bãi biển lúc bình minh, anh quỳ xuống với chiếc nhẫn đã giấu trong túi áo suốt cả chuyến đi. Em đã khóc, đã cười, và đã nói “Đồng ý”.",
        photo: { src: "assets/images/cuoi/chuyen-3.webp", focus: "50% 10%" }
      },
      {
        date: "Tháng 10, 2026",
        title: "Về chung một nhà",
        text: "Sau gần tám năm đồng hành, chúng mình quyết định viết tiếp câu chuyện dưới một mái nhà. Cảm ơn vì đã luôn là bến đỗ bình yên của nhau.",
        photo: { src: "assets/images/cuoi/chuyen-4.webp", focus: "50% 15%" }
      }
    ]
  },

  /* ---------- Lời ngỏ ---------- (xuống dòng bằng \n) */
  letter: {
    title: "Lời Ngỏ",
    text: "Trân trọng kính mời quý vị\ntới dự bữa cơm thân mật,\nchung vui cùng gia đình chúng tôi.\nSự hiện diện của quý vị\nlà niềm vinh hạnh cho gia đình chúng tôi!\nRất hân hạnh được đón tiếp!",
    photo: { src: "assets/images/cuoi/loi-ngo.webp", focus: "50% 35%" }
  },

  /* ---------- Sự kiện cưới ----------
     start: "NĂM-THÁNG-NGÀY GIỜ:PHÚT"; hours: thời lượng (để tạo lịch nhắc);
     map: link Google Maps (bỏ trống sẽ tự tìm theo địa chỉ);
     lunar: ngày âm lịch (tuỳ chọn), ví dụ "Tức ngày 12 tháng 11 năm Bính Ngọ";
     dressCode: mã màu trang phục gợi ý (tuỳ chọn). */
  events: {
    title: "Sự Kiện Cưới",
    subtitle: "Sự hiện diện của quý vị là niềm vinh hạnh cho gia đình chúng tôi.",
    items: [
      {
        title: "Tiệc Cưới Nhà Gái",
        start: "2026-10-19 17:00",
        hours: 3,
        place: "Tư gia nhà gái",
        address: "Xóm Bến Mới, Tân Phong, Ý Yên, Ninh Bình",
        map: "https://www.google.com/maps/search/?api=1&query=20.3179359,105.9642715",
        lunar: "Tức ngày 10 tháng 09 năm Bính Ngọ",
        photo: { src: "assets/images/cuoi/tiec-nha-gai.webp", focus: "46% 20%" },
        dressCode: []
      },
      {
        title: "Lễ Cưới Nhà Gái",
        start: "2026-10-20 07:30",
        hours: 1.5,
        place: "Tư gia nhà gái",
        address: "Xóm Bến Mới, Tân Phong, Ý Yên, Ninh Bình",
        map: "https://www.google.com/maps/search/?api=1&query=20.3179359,105.9642715",
        lunar: "Tức ngày 11 tháng 09 năm Bính Ngọ",
        photo: { src: "assets/images/cuoi/le-cuoi-nha-gai.webp", focus: "48% 10%" },
        dressCode: []
      },
      {
        title: "Lễ Thành Hôn",
        start: "2026-10-20 09:00",
        hours: 1,
        place: "Tư gia nhà trai",
        address: "131 La Xuyên, Vũ Dương, Ninh Bình",
        map: "https://www.google.com/maps/search/?api=1&query=20.308177947998047,106.04753875732422",
        lunar: "Tức ngày 11 tháng 09 năm Bính Ngọ",
        photo: { src: "assets/images/cuoi/le-thanh-hon.webp", focus: "55% 20%" },
        dressCode: []
      },
      {
        title: "Tiệc Cưới Nhà Trai",
        start: "2026-10-20 10:00",
        hours: 3,
        place: "Tư gia nhà trai",
        address: "131 La Xuyên, Vũ Dương, Ninh Bình",
        map: "https://www.google.com/maps/search/?api=1&query=20.308177947998047,106.04753875732422",
        lunar: "Tức ngày 11 tháng 09 năm Bính Ngọ",
        photo: { src: "assets/images/cuoi/tiec-nha-trai.webp", focus: "45% 13%" },
        dressCode: []
      }
    ]
  },

  /* ---------- Cô dâu & chú rể (tiêu đề phần) ---------- */
  couple: {
    title: "Cô Dâu & Chú Rể"
  },

  /* ---------- Phù dâu & phù rể ---------- (đã tắt)
     Muốn bật lại: thay null bằng
     { title: "Phù Dâu & Phù Rể", subtitle: "...", members: [ { name: "...", role: "Phù dâu", photo: "assets/images/...", bio: "..." } ] } */
  party: null,

  /* ---------- Hộp mừng cưới ----------
     qr: ảnh mã QR (đã dựng lại từ mã QR trong app ngân hàng, nội dung giữ nguyên).
     Nếu bỏ trống qr, mã được tự tạo qua VietQR từ bankId (mã BIN) + accountNumber:
     Vietcombank 970436 · Techcombank 970407 · BIDV 970418 · VietinBank 970415
     Agribank 970405 · MB 970422 · ACB 970416 · VPBank 970432 · TPBank 970423
     Sacombank 970403 · VIB 970441 · HDBank 970437 (danh sách đầy đủ: https://api.vietqr.io/v2/banks) */
  gifts: {
    title: "Hộp mừng cưới",
    subtitle: "Cảm ơn tấm lòng của bạn — sự hiện diện của bạn đã là món quà ý nghĩa nhất với chúng mình.",
    accounts: [
      {
        label: "Mừng cưới chú rể",
        bank: "MB Bank",
        bankId: "970422",
        accountName: "NINH VAN TOAN",
        accountNumber: "0976360826",
        qr: "assets/images/qr-chu-re.svg"
      },
      {
        label: "Mừng cưới cô dâu",
        bank: "Vietcombank",
        bankId: "970436",
        accountName: "NGUYEN THI YEN",
        accountNumber: "9372920816",
        qr: "assets/images/qr-co-dau.svg"
      }
    ]
  },

  /* ---------- Sổ lưu bút ---------- */
  wishes: {
    title: "Sổ Lưu Bút",
    subtitle: "Hãy để lại đôi lời chúc phúc để chúng mình lưu giữ mãi nhé!",
    toast: true,                        // hiện lần lượt lời chúc ở góc màn hình
    samples: [                          // lời chúc mẫu (chỉ hiện khi CHƯA kết nối Google Sheets)
      { name: "Lan Anh", message: "Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nha! 💕" },
      { name: "Đức Thắng", message: "Chúc mừng hạnh phúc! Mãi yêu thương và luôn là tri kỷ của nhau nhé." },
      { name: "Chị Hương", message: "Chúc cô dâu chú rể luôn giữ được ngọn lửa yêu thương như ngày đầu. Hạnh phúc viên mãn!" },
      { name: "Minh Tú", message: "Cuối cùng cũng đến ngày này rồi! Chúc hai đứa đầu bạc răng long ❤️" },
      { name: "Gia đình bác Tư", message: "Chúc các cháu thuận vợ thuận chồng, tát biển Đông cũng cạn." }
    ]
  },

  /* ---------- Xác nhận tham dự ---------- (đặt rsvp: null để ẩn) */
  rsvp: {
    title: "Xác nhận tham dự",
    subtitle: "Bạn xác nhận giúp chúng mình để việc đón tiếp được chu đáo nhất nhé!",
    maxGuests: 5
  },

  /* ---------- Chân trang ---------- */
  footer: {
    title: "Thank you!"
  },

  /* ---------- Lưu lời chúc & xác nhận vào Google Sheets ----------
     Dán link Web App của Google Apps Script (xem README.md). Để "" = chế độ demo:
     dữ liệu chỉ lưu trên trình duyệt của người gửi. */
  api: {
    endpoint: ""
  }
};

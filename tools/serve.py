"""Máy chủ xem thử thiệp cưới trên máy: python tools/serve.py [cổng]  (mặc định 5500)
Chạy trong thư mục dự án rồi mở http://localhost:5500
Tắt bộ nhớ đệm của trình duyệt, nên sửa ảnh/nội dung xong chỉ cần F5 là thấy ngay."""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


for s in (sys.stdout, sys.stderr):  # tránh lỗi in tiếng Việt khi cửa sổ lệnh không hỗ trợ
    try:
        s.reconfigure(errors='replace')
    except Exception:
        pass
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
print(f'Thiệp cưới: http://localhost:{port}  (Ctrl+C để dừng)', flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler).serve_forever()

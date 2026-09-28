"""Công cụ ảnh cho thiệp cưới (cần Python 3 + Pillow: pip install pillow).

1) Xem nhanh cả thư mục ảnh — tạo bảng ảnh đánh số và file thông số từng ảnh:
       python tools/anh.py xem "D:/Anh cuoi"
   Kết quả nằm trong "D:/Anh cuoi/_xem-nhanh/" (bang-anh-01.jpg..., thong-tin.json).

2) Xuất các ảnh đã chọn cho web — xoay đúng chiều, chuyển màu về sRGB, thu nhỏ,
   nén, xoá toàn bộ EXIF (kể cả vị trí GPS):
       python tools/anh.py xuat tools/chon-anh.json

   Mẫu chon-anh.json:
   {
     "source": "D:/Anh cuoi",
     "out": "assets/images",
     "quality": 82,
     "items": [
       {"from": "DSC_0012.jpg", "to": "hero.jpg", "max": 2000},
       {"from": "DSC_0101.jpg", "to": "album/01.jpg", "max": 1600},
       {"from": "DSC_0040.jpg", "to": "og-cover.jpg", "crop": [1200, 630], "focus": [0.5, 0.4]}
     ]
   }
   "max": cạnh dài tối đa (px) · "crop": cắt đúng kích thước · "focus": tâm cắt (0–1, ngang–dọc)
   "box": [trái, trên, phải, dưới] (0–1) cắt lấy một vùng trước khi thu nhỏ

Ảnh iPhone .HEIC cần thêm: pip install pillow-heif
"""
import argparse
import io
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageCms, ImageDraw, ImageFilter, ImageFont, ImageOps, ImageStat

try:  # đọc được ảnh .HEIC nếu có cài pillow-heif
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp', '.heic', '.heif'}
SRGB = ImageCms.createProfile('sRGB')


def load(path, preview=0):
    """Mở ảnh, xoay theo EXIF Orientation, chuyển màu về sRGB (ví dụ ảnh iPhone Display P3).
    preview > 0: giải mã JPEG ở cỡ nhỏ (nhanh hơn nhiều) — chỉ dùng để xem, không dùng để xuất."""
    im = Image.open(path)
    exif = im.getexif()
    icc = im.info.get('icc_profile')
    if preview and im.format == 'JPEG':
        im.draft('RGB', (preview, preview))
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        rgba = im.convert('RGBA')
        bg = Image.new('RGB', rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[-1])
        im = bg
    else:
        im = im.convert('RGB')
    if icc:
        try:
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), SRGB, outputMode='RGB')
        except Exception:
            pass  # hồ sơ màu lỗi → giữ nguyên
    return im, exif


def taken_at(exif):
    try:
        v = exif.get_ifd(0x8769).get(0x9003) or exif.get(0x0132)  # DateTimeOriginal / DateTime
        return str(v).strip() if v else ''
    except Exception:
        return ''


def palette(im, n=5):
    q = im.resize((64, 64)).quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: n * 3]
    return ['#%02x%02x%02x' % tuple(pal[i * 3: i * 3 + 3]) for _, i in sorted(q.getcolors(), reverse=True)]


def sharpness(im):
    """Độ nét tương đối (phương sai biên cạnh) — số càng lớn ảnh càng nét."""
    g = im.convert('L')
    if g.width > 800:
        g = g.resize((800, round(800 * g.height / g.width)))
    return round(ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).var[0], 1)


def font(size):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf',
              '/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def cmd_xem(a):
    src = Path(a.folder)
    out = Path(a.out) if a.out else src / '_xem-nhanh'
    files = sorted((p for p in src.rglob('*') if p.is_file() and p.suffix.lower() in EXTS and out not in p.parents),
                   key=lambda p: str(p).lower())
    out.mkdir(parents=True, exist_ok=True)
    info, thumbs = [], []
    for p in files:
        try:
            with Image.open(p) as raw:  # kích thước gốc (đọc phần đầu file, không giải mã)
                w, h = raw.size
                if raw.getexif().get(0x0112, 1) in (5, 6, 7, 8):
                    w, h = h, w
            im, exif = load(p, preview=900)
        except Exception as e:  # file hỏng / định dạng chưa hỗ trợ
            print(f'  bỏ qua {p.name}: {e}', file=sys.stderr)
            continue
        i = len(info) + 1
        r = w / h
        info.append({
            'so': i, 'file': p.relative_to(src).as_posix(), 'w': w, 'h': h,
            'chieu': 'vuông' if 0.9 <= r <= 1.1 else ('dọc' if r < 1 else 'ngang'),
            'ti_le': round(r, 3), 'kb': round(p.stat().st_size / 1024),
            'chup_luc': taken_at(exif), 'do_net': sharpness(im), 'mau': palette(im),
        })
        im.thumbnail((a.cell, a.cell), Image.LANCZOS)
        thumbs.append((i, p.name, w, h, im))

    cell, cols, pad, lab = a.cell, a.cols, 12, 46
    f1, f2 = font(16), font(12)
    for s in range(0, len(thumbs), a.per):
        chunk = thumbs[s:s + a.per]
        rows = math.ceil(len(chunk) / cols)
        sheet = Image.new('RGB', (cols * (cell + pad) + pad, rows * (cell + lab + pad) + pad), (236, 236, 236))
        d = ImageDraw.Draw(sheet)
        for k, (i, name, w, h, t) in enumerate(chunk):
            x = pad + (k % cols) * (cell + pad)
            y = pad + (k // cols) * (cell + lab + pad)
            d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(255, 255, 255))
            sheet.paste(t, (x + (cell - t.width) // 2, y + (cell - t.height) // 2))
            d.text((x + 2, y + cell + 4), f'#{i}   {w}×{h}', fill=(20, 20, 20), font=f1)
            d.text((x + 2, y + cell + 26), name if len(name) <= 38 else name[:35] + '…', fill=(110, 110, 110), font=f2)
        sheet.save(out / f'bang-anh-{s // a.per + 1:02d}.jpg', quality=86)
    (out / 'thong-tin.json').write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(info)} ảnh → {out}')


def cmd_xuat(a):
    cfg = json.loads(Path(a.map).read_text(encoding='utf-8'))
    src = Path(cfg['source'])
    base = Path(a.out).resolve() if a.out else ROOT
    out = Path(a.out).resolve() if a.out else (ROOT / cfg.get('out', 'assets/images')).resolve()
    quality = cfg.get('quality', 82)
    result = []
    for it in cfg['items']:
        im, _ = load(src / it['from'])
        if 'box' in it:  # cắt một vùng trước (tỉ lệ 0–1: trái, trên, phải, dưới), ví dụ lấy riêng chú rể
            x0, y0, x1, y1 = it['box']
            im = im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))
        if 'crop' in it:
            fx, fy = it.get('focus', [0.5, 0.5])
            im = ImageOps.fit(im, tuple(it['crop']), Image.LANCZOS, centering=(fx, fy))
        else:
            m = it.get('max', 1600)
            im.thumbnail((m, m), Image.LANCZOS)
        dst = out / it['to']
        dst.parent.mkdir(parents=True, exist_ok=True)
        ext = dst.suffix.lower()
        if ext == '.png':
            im.save(dst, 'PNG', optimize=True)
        elif ext == '.webp':
            im.save(dst, 'WEBP', quality=it.get('quality', quality), method=6)
        else:  # JPEG progressive, không kèm EXIF/GPS
            im.save(dst, 'JPEG', quality=it.get('quality', quality), optimize=True, progressive=True, subsampling='4:2:0')
        rel = dst.relative_to(base).as_posix()
        result.append({'to': rel, 'w': im.width, 'h': im.height, 'kb': round(dst.stat().st_size / 1024)})
        print(f"  {it['from']} → {rel}  {im.width}×{im.height}  {result[-1]['kb']} KB")
    total = sum(r['kb'] for r in result)
    print(f'Tổng: {len(result)} ảnh, {total / 1024:.1f} MB')
    if a.json:
        Path(a.json).write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding='utf-8')


def main():
    for s in (sys.stdout, sys.stderr):  # tránh lỗi in tiếng Việt khi cửa sổ lệnh không hỗ trợ
        try:
            s.reconfigure(errors='replace')
        except Exception:
            pass
    ap = argparse.ArgumentParser(description='Công cụ ảnh cho thiệp cưới')
    sub = ap.add_subparsers(dest='cmd', required=True)
    x = sub.add_parser('xem', help='tạo bảng ảnh xem nhanh + thông số')
    x.add_argument('folder')
    x.add_argument('--out', help='thư mục lưu bảng ảnh (mặc định <folder>/_xem-nhanh)')
    x.add_argument('--cell', type=int, default=300, help='cỡ ô ảnh (px)')
    x.add_argument('--cols', type=int, default=4)
    x.add_argument('--per', type=int, default=20, help='số ảnh mỗi bảng')
    x.set_defaults(fn=cmd_xem)
    e = sub.add_parser('xuat', help='xuất ảnh đã chọn cho web')
    e.add_argument('map', help='file JSON phân bổ ảnh')
    e.add_argument('--out', help='xuất vào thư mục này thay cho "out" trong file JSON')
    e.add_argument('--json', help='ghi kích thước ảnh xuất ra file JSON')
    e.set_defaults(fn=cmd_xuat)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()

"""Recreate NWM logo as PNG asset (navy ring + orange fills + white band + NWM text)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)

NAVY = (30, 58, 138)
ORANGE = (249, 115, 22)
WHITE = (255, 255, 255)

BOLD = "C:/Windows/Fonts/arialbd.ttf"


def build_logo(size=1024, transparent=True):
    S = size
    mode = "RGBA" if transparent else "RGB"
    bg = (0, 0, 0, 0) if transparent else WHITE
    img = Image.new(mode, (S, S), bg)
    d = ImageDraw.Draw(img)

    r_outer = int(S * 0.48)
    r_inner = int(S * 0.445)
    cx, cy = S // 2, S // 2

    d.ellipse([(cx - r_outer, cy - r_outer), (cx + r_outer, cy + r_outer)], fill=NAVY)
    d.ellipse([(cx - r_inner, cy - r_inner), (cx + r_inner, cy + r_inner)], fill=ORANGE)

    band_h = int(S * 0.24)
    d.rectangle([(cx - r_inner - 2, cy - band_h // 2), (cx + r_inner + 2, cy + band_h // 2)], fill=WHITE)

    # clip band to circle by re-drawing small arcs on outer navy
    # (simple version: overlay navy ring by drawing a ring)
    for w in range(int(S * 0.015)):
        d.ellipse(
            [(cx - r_outer + w, cy - r_outer + w), (cx + r_outer - w, cy + r_outer - w)],
            outline=NAVY, width=1,
        )

    font_size = int(S * 0.22)
    fnt = ImageFont.truetype(BOLD, font_size)
    text = "NWM"
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1]
    d.text((tx, ty), text, font=fnt, fill=NAVY)

    return img


def main():
    img_1024 = build_logo(1024, transparent=True)
    img_1024.save(OUT / "nwm-logo.png", "PNG")
    img_512 = build_logo(512, transparent=True)
    img_512.save(OUT / "nwm-logo-512.png", "PNG")
    img_256 = build_logo(256, transparent=True)
    img_256.save(OUT / "nwm-logo-256.png", "PNG")
    print(f"[logo] {OUT}/nwm-logo.png + 512 + 256")


if __name__ == "__main__":
    main()

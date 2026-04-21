"""
NetWebMedia CMO Package — IG Reel 01 builder v6.
Free stack: Pillow + edge-tts + moviepy + free stock CDN footage.
Output: out/reel.mp4 (1080x1920, ~30s, 30fps, H.264).

v6 changes:
- Messaging pivot: sell AI automations on autopilot
- Captions removed entirely (cleaner, no overlap)
- All 6 shots have real photo/b-roll backgrounds
- Ken-burns zoom 0.10 on all shots
- New overlays: overlay_2_auto, overlay_3_features, overlay_4_autopilot
- New b-roll: robot hand (Shot 2), analytics laptop (Shot 3), cafe workspace (Shot 4)
"""
import asyncio
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).parent
OUT = ROOT / "out"
ASSETS = ROOT / "assets"
STOCK = ASSETS / "stock"
OUT.mkdir(exist_ok=True)

W, H = 1080, 1920

# Brand palette — derived from NWM logo
NAVY = (30, 58, 138)        # #1E3A8A outer ring
NAVY_DARK = (18, 35, 83)
BLACK = (0, 0, 0)
ORANGE = (249, 115, 22)     # #F97316 brand accent
ORANGE_DEEP = (210, 90, 14)
WHITE = (255, 255, 255)
DIM = (200, 210, 225)
RED = (220, 60, 80)

FONT_DIR = Path("C:/Windows/Fonts")
BOLD = str(FONT_DIR / "arialbd.ttf")
REG = str(FONT_DIR / "arial.ttf")

# Stock + logo assets
PHOTO_HOOK     = STOCK / "w_3861958.jpg"       # Woman at dual monitors / code (Shot 1)
PHOTO_AUTO     = STOCK / "auto_8849287.jpg"    # Robot hand, blue bokeh — AI/automation (Shot 2)
PHOTO_FEATURES = STOCK / "auto_7693142.jpg"    # Laptop with analytics dashboard (Shot 3)
PHOTO_SLEEP    = STOCK / "sleep_31964019.jpg"  # Cafe laptop coffee workspace (Shot 4)
PHOTO_PROOF    = STOCK / "m_6937860.jpg"       # Man at startup desk, professional (Shot 5)
LOGO_512 = ASSETS / "nwm-logo-512.png"
LOGO_256 = ASSETS / "nwm-logo-256.png"


def font(size, bold=True):
    return ImageFont.truetype(BOLD if bold else REG, size)


def gradient_bg(top=NAVY, bottom=BLACK):
    img = Image.new("RGB", (W, H), top)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    return img


def grid_overlay(img, spacing=60, alpha=12):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, W, spacing):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, alpha), width=1)
    for y in range(0, H, spacing):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, alpha), width=1)
    base = img.convert("RGBA") if img.mode != "RGBA" else img
    return Image.alpha_composite(base, overlay).convert("RGB")


def center_text(draw, y, text, fnt, fill):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    w = bbox[2] - bbox[0]
    x = (W - w) // 2
    draw.text((x, y), text, font=fnt, fill=fill)


def blur_glow(img, pos, text, fnt, color, radius=20, alpha=160):
    """Soft colored glow behind text. Preserves alpha on RGBA input."""
    glow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.text(pos, text, font=fnt, fill=color + (alpha,))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius))
    base = img.convert("RGBA") if img.mode != "RGBA" else img
    return Image.alpha_composite(base, glow_layer)


# ---------- Shot assets (overlays for video shots / full cards for static shots) ----------

def overlay_1_hook():
    """Shot 1 — Hook overlay. Composited over woman-at-dual-monitors photo."""
    img = Image.new("RGBA", (W, H), (4, 10, 30, 110))  # lighter dim — show woman clearly
    d = ImageDraw.Draw(img)

    center_text(d, 340, "Your agency charges", font(62, bold=False), DIM)

    old_price = "$8,000/mo"
    fnt = font(140)
    bbox = d.textbbox((0, 0), old_price, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    d.text((x, 440), old_price, font=fnt, fill=WHITE)
    # orange strike-through
    d.line([(x - 20, 580), (x + tw + 20, 520)], fill=ORANGE, width=12)

    center_text(d, 800, "Starting at", font(60, bold=False), DIM)

    price = "$249"
    fnt2 = font(320)
    bbox = d.textbbox((0, 0), price, font=fnt2)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    img = blur_glow(img, (x, 890), price, fnt2, ORANGE, radius=28, alpha=200)
    d = ImageDraw.Draw(img)
    d.text((x, 890), price, font=fnt2, fill=ORANGE)

    center_text(d, 1230, "/month", font(70, bold=False), DIM)
    return img


def draw_checkmark(draw, cx, cy, size=28, color=None, width=9):
    """Draw a bold checkmark using two line segments (no font needed)."""
    if color is None:
        color = ORANGE
    x0, y0 = cx - size, cy
    xm, ym = cx - size // 3, cy + size
    x1, y1 = cx + size, cy - size
    draw.line([(x0, y0), (xm, ym)], fill=color, width=width)
    draw.line([(xm, ym), (x1, y1)], fill=color, width=width)


def overlay_2_auto():
    """Shot 2 — AI automation pitch. Composited over robot-hand bokeh bg."""
    img = Image.new("RGBA", (W, H), (4, 8, 24, 140))
    d = ImageDraw.Draw(img)

    # Giant "AI" with orange glow
    fnt_big = font(260)
    ai_bbox = d.textbbox((0, 0), "AI", font=fnt_big)
    ai_w = ai_bbox[2] - ai_bbox[0]
    ai_x = (W - ai_w) // 2
    img = blur_glow(img, (ai_x, 260), "AI", fnt_big, ORANGE, radius=50, alpha=220)
    d = ImageDraw.Draw(img)
    d.text((ai_x, 260), "AI", font=fnt_big, fill=ORANGE)

    center_text(d, 610, "AUTOMATIONS.", font(106), WHITE)
    center_text(d, 780, "Your entire marketing,", font(58, bold=False), DIM)
    center_text(d, 862, "on autopilot.", font(58, bold=False), DIM)
    return img


def overlay_3_features():
    """Shot 3 — feature list. Composited over analytics-laptop bg."""
    img = Image.new("RGBA", (W, H), (4, 8, 24, 155))
    d = ImageDraw.Draw(img)

    center_text(d, 250, "One stack.", font(100), WHITE)
    center_text(d, 390, "Four superpowers.", font(64, bold=False), DIM)

    fnt = font(86)
    items = ["Strategy", "Content", "AEO", "CRM"]
    ck_size = 32
    gap = 28
    widths = [d.textbbox((0, 0), t, font=fnt)[2] for t in items]
    max_w = max(widths)
    block_w = (ck_size * 2) + gap + max_w
    block_x = (W - block_w) // 2
    text_x = block_x + (ck_size * 2) + gap

    ys = [530, 690, 850, 1010]
    for text, y in zip(items, ys):
        line_mid_y = y + 54
        draw_checkmark(d, block_x + ck_size, line_mid_y, size=ck_size, width=10)
        d.text((text_x, y), text, font=fnt, fill=WHITE)

    center_text(d, 1200, "All automated.", font(90), ORANGE)
    return img


def overlay_4_autopilot():
    """Shot 4 — set it and forget it. Composited over cafe workspace bg."""
    img = Image.new("RGBA", (W, H), (4, 8, 24, 150))
    d = ImageDraw.Draw(img)

    center_text(d, 360, "Set it.", font(170), WHITE)

    # "Forget it." in orange with glow
    fnt_fi = font(170)
    fi_txt = "Forget it."
    fi_bbox = d.textbbox((0, 0), fi_txt, font=fnt_fi)
    fi_w = fi_bbox[2] - fi_bbox[0]
    fi_x = (W - fi_w) // 2
    img = blur_glow(img, (fi_x, 580), fi_txt, fnt_fi, ORANGE, radius=30, alpha=200)
    d = ImageDraw.Draw(img)
    d.text((fi_x, 580), fi_txt, font=fnt_fi, fill=ORANGE)

    center_text(d, 860, "Your marketing runs", font(58, bold=False), DIM)
    center_text(d, 944, "on autopilot.", font(58, bold=False), DIM)
    return img


def overlay_5_proof():
    """Shot 5 — Proof overlay. Composited over man-at-startup-desk photo."""
    img = Image.new("RGBA", (W, H), (4, 10, 30, 150))
    d = ImageDraw.Draw(img)

    d.text((80, 340), '"', font=font(360), fill=ORANGE + (230,))

    center_text(d, 680, "One team.", font(108), WHITE)
    center_text(d, 820, "One price.", font(108), WHITE)
    center_text(d, 1000, "Built for founders", font(64, bold=False), DIM)
    center_text(d, 1080, "who move fast.", font(64, bold=False), DIM)

    center_text(d, 1260, "— NetWebMedia", font(48), ORANGE)
    return img


def card_6_cta():
    img = gradient_bg()
    d = ImageDraw.Draw(img)

    # orange radial rings
    for r in range(900, 200, -80):
        alpha = int(40 * (1 - r / 900))
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([(W // 2 - r, H // 2 - r), (W // 2 + r, H // 2 + r)],
                   outline=ORANGE + (alpha,), width=2)
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # logo top
    logo = Image.open(LOGO_256).convert("RGBA")
    lw, lh = logo.size
    lx = (W - lw) // 2
    img_rgba = img.convert("RGBA")
    img_rgba.paste(logo, (lx, 240), logo)
    img = img_rgba.convert("RGB")
    d = ImageDraw.Draw(img)

    domain = "netwebmedia.com"
    fnt = font(104)
    bbox = d.textbbox((0, 0), domain, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    img = blur_glow(img, (x, 620), domain, fnt, WHITE, radius=16, alpha=200)
    d = ImageDraw.Draw(img)
    d.text((x, 620), domain, font=fnt, fill=WHITE)

    center_text(d, 820, "Starting at", font(60, bold=False), DIM)
    center_text(d, 920, "$249", font(200), ORANGE)
    center_text(d, 1200, "/month", font(56, bold=False), DIM)
    return img


def build_assets():
    """Render all 6 shot PNGs. Overlays (1-5) RGBA; card (6) RGB."""
    assets = {}

    assets["01_hook"] = OUT / "01_hook.png"
    overlay_1_hook().save(assets["01_hook"], "PNG")

    assets["02_auto"] = OUT / "02_auto.png"
    overlay_2_auto().save(assets["02_auto"], "PNG")

    assets["03_features"] = OUT / "03_features.png"
    overlay_3_features().save(assets["03_features"], "PNG")

    assets["04_autopilot"] = OUT / "04_autopilot.png"
    overlay_4_autopilot().save(assets["04_autopilot"], "PNG")

    assets["05_proof"] = OUT / "05_proof.png"
    overlay_5_proof().save(assets["05_proof"], "PNG")

    assets["06_cta"] = OUT / "06_cta.png"
    card_6_cta().save(assets["06_cta"], "PNG")

    for name, p in assets.items():
        print(f"[asset] {p.name}  ({p.stat().st_size / 1024:.0f} KB)")
    return assets


# ---------- Voiceover ----------

VO_SCRIPT = (
    "Your agency charges eight thousand a month. "
    "We start at two hundred forty-nine. "
    "AI automations that run your entire marketing. "
    "Strategy. Content. AEO. CRM. All automated. "
    "Set it and forget it. Your marketing runs on autopilot. "
    "One team. One price. Built for founders who move fast. "
    "Visit netwebmedia dot com. Starting at two hundred forty-nine dollars."
)


async def build_voiceover():
    import edge_tts
    vo_path = OUT / "voiceover.mp3"
    communicate = edge_tts.Communicate(
        VO_SCRIPT, "en-US-GuyNeural", rate="+8%", boundary="WordBoundary"
    )
    words = []
    with open(vo_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                dur = chunk["duration"] / 1e7
                words.append((start, start + dur, chunk["text"]))
    # edge-tts strips punctuation from word text; re-attach using VO_SCRIPT tokens
    script_tokens = VO_SCRIPT.split()
    aligned = []
    for i, (s, e, t) in enumerate(words):
        tok = script_tokens[i] if i < len(script_tokens) else t
        aligned.append((s, e, tok))
    print(f"[vo] {vo_path.name}  ({len(aligned)} words, {aligned[-1][1]:.2f}s total)")
    return vo_path, aligned


def _srt_ts(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


# ---------- VO-synced shot windows ----------

# Word index reference for SHOT_WORD_STARTS (v6 VO — 56 words total):
#  Shot 1 (0):   Your(0) agency(1) charges(2) eight(3) thousand(4) a(5) month.(6)
#                We(7) start(8) at(9) two(10) hundred(11) forty-nine.(12)
#  Shot 2 (13):  AI(13) automations(14) that(15) run(16) your(17) entire(18) marketing.(19)
#  Shot 3 (20):  Strategy.(20) Content.(21) AEO.(22) CRM.(23) All(24) automated.(25)
#  Shot 4 (26):  Set(26) it(27) and(28) forget(29) it.(30) Your(31) marketing(32)
#                runs(33) on(34) autopilot.(35)
#  Shot 5 (36):  One(36) team.(37) One(38) price.(39) Built(40) for(41) founders(42)
#                who(43) move(44) fast.(45)
#  Shot 6 (46):  Visit(46) netwebmedia(47) dot(48) com.(49) Starting(50) at(51)
#                two(52) hundred(53) forty-nine(54) dollars.(55)
SHOT_WORD_STARTS = [0, 13, 20, 26, 36, 46]


def compute_shot_windows(words):
    """Return [(start, end), ...] seconds for each of the 6 shots."""
    windows = []
    n = len(SHOT_WORD_STARTS)
    for i in range(n):
        start_idx = SHOT_WORD_STARTS[i]
        start_sec = 0.0 if i == 0 else words[start_idx][0]
        if i + 1 < n:
            end_idx = SHOT_WORD_STARTS[i + 1]
            end_sec = words[end_idx][0]
        else:
            end_sec = words[-1][1] + 0.5  # tail after last word
        windows.append((start_sec, end_sec))
    return windows


# ---------- Moviepy assembly ----------

def _photo_clip(path, dur, zoom=0.10):
    """Cover-fit photo to 1080x1920 with ken-burns zoom."""
    from moviepy import ImageClip, CompositeVideoClip
    clip = ImageClip(str(path)).with_duration(dur)
    r = clip.w / clip.h
    if r > (W / H):
        clip = clip.resized(height=H)
    else:
        clip = clip.resized(width=W)
    clip = clip.resized(lambda t, d=dur: 1.0 + zoom * (t / d))
    clip = clip.with_position("center")
    return CompositeVideoClip([clip], size=(W, H)).with_duration(dur)


def build_reel(assets, vo_path, shot_windows):
    from moviepy import (
        ImageClip, AudioFileClip, CompositeVideoClip,
        concatenate_videoclips,
    )
    from moviepy.video.fx import CrossFadeIn

    # Shot 1 — woman at dual monitors + hook overlay
    dur1 = shot_windows[0][1] - shot_windows[0][0]
    bg1 = _photo_clip(PHOTO_HOOK, dur1, zoom=0.10)
    ov1 = ImageClip(str(assets["01_hook"])).with_duration(dur1)
    shot1 = CompositeVideoClip([bg1, ov1], size=(W, H)).with_duration(dur1)

    # Shot 2 — robot hand bokeh + AI automations overlay
    dur2 = shot_windows[1][1] - shot_windows[1][0]
    bg2 = _photo_clip(PHOTO_AUTO, dur2, zoom=0.10)
    ov2 = ImageClip(str(assets["02_auto"])).with_duration(dur2)
    shot2 = CompositeVideoClip([bg2, ov2], size=(W, H)).with_duration(dur2)

    # Shot 3 — analytics laptop + features overlay
    dur3 = shot_windows[2][1] - shot_windows[2][0]
    bg3 = _photo_clip(PHOTO_FEATURES, dur3, zoom=0.10)
    ov3 = ImageClip(str(assets["03_features"])).with_duration(dur3)
    shot3 = CompositeVideoClip([bg3, ov3], size=(W, H)).with_duration(dur3)

    # Shot 4 — cafe workspace + autopilot overlay
    dur4 = shot_windows[3][1] - shot_windows[3][0]
    bg4 = _photo_clip(PHOTO_SLEEP, dur4, zoom=0.10)
    ov4 = ImageClip(str(assets["04_autopilot"])).with_duration(dur4)
    shot4 = CompositeVideoClip([bg4, ov4], size=(W, H)).with_duration(dur4)

    # Shot 5 — man at startup desk + proof overlay
    dur5 = shot_windows[4][1] - shot_windows[4][0]
    bg5 = _photo_clip(PHOTO_PROOF, dur5, zoom=0.10)
    ov5 = ImageClip(str(assets["05_proof"])).with_duration(dur5)
    shot5 = CompositeVideoClip([bg5, ov5], size=(W, H)).with_duration(dur5)

    # Shot 6 — CTA static card with gentle zoom
    dur6 = shot_windows[5][1] - shot_windows[5][0]
    shot6 = ImageClip(str(assets["06_cta"])).with_duration(dur6)
    shot6 = shot6.resized(lambda t, d=dur6: 1.0 + 0.07 * (t / d))
    shot6 = shot6.with_position("center")
    shot6 = CompositeVideoClip([shot6], size=(W, H)).with_duration(dur6)

    shots = [shot1, shot2, shot3, shot4, shot5, shot6]
    faded = [shots[0]]
    for s in shots[1:]:
        faded.append(s.with_effects([CrossFadeIn(0.25)]))

    base = concatenate_videoclips(faded, method="compose")

    audio = AudioFileClip(str(vo_path))
    audio = audio.with_duration(min(base.duration, audio.duration))
    composed = base.with_audio(audio)

    out_path = OUT / "reel.mp4"
    composed.write_videofile(
        str(out_path),
        fps=30,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        bitrate="6000k",
        threads=4,
    )
    print(f"[reel] {out_path}")
    return out_path


# ---------- Main ----------

def main():
    print("== NetWebMedia CMO Reel 01 builder v6 ==")
    assets = build_assets()
    vo, words = asyncio.run(build_voiceover())
    windows = compute_shot_windows(words)
    for i, (s, e) in enumerate(windows, 1):
        print(f"[shot {i}] {s:6.2f}s -> {e:6.2f}s  ({e - s:.2f}s)")
    reel = build_reel(assets, vo, windows)
    print(f"\nDONE: {reel}")
    print(f"Size: {reel.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()

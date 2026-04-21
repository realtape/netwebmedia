"""
NetWebMedia Service Reels — builds 5 separate IG Reels (one per service).

Output: campaigns/service-reels/out/{service_id}/reel.mp4
        1080x1920, ~30s, 30fps, H.264.

Stack: Pillow + edge-tts + moviepy (same as cmo-package-reel-01/build.py).

Shot structure (6 shots per reel, all real photo bg + RGBA overlays):
  1. Host intro      — host.png portrait + hook question
  2. Pain / context  — b_roll[0] + service title
  3. Solution        — b_roll[1] + one-liner description
  4. Features        — b_roll[2] + 4 orange checkmarks
  5. Social proof    — b_roll[3] + pull-quote
  6. CTA             — gradient bg + logo + domain glow + price

Each service build is wrapped in try/except so one failure does not block
the other four.
"""
from __future__ import annotations

import asyncio
import traceback
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


# ---------- Paths & canvas ----------

ROOT = Path(__file__).parent
OUT_ROOT = ROOT / "out"
ASSETS = ROOT / "assets"
HOST_PORTRAIT = ASSETS / "host.png"

# Re-use the CMO reel's stock library + logo — no need to duplicate files.
CMO_ASSETS = ROOT.parent / "cmo-package-reel-01" / "assets"
STOCK_DIR = CMO_ASSETS / "stock"
LOGO_256 = CMO_ASSETS / "nwm-logo-256.png"

OUT_ROOT.mkdir(exist_ok=True)

W, H = 1080, 1920


# ---------- Brand palette ----------

NAVY = (30, 58, 138)       # #1E3A8A
NAVY_DARK = (18, 35, 83)
BLACK = (0, 0, 0)
ORANGE = (249, 115, 22)    # #F97316
ORANGE_DEEP = (210, 90, 14)
WHITE = (255, 255, 255)
DIM = (200, 210, 225)

FONT_DIR = Path("C:/Windows/Fonts")
BOLD = str(FONT_DIR / "arialbd.ttf")
REG = str(FONT_DIR / "arial.ttf")


def font(size, bold=True):
    return ImageFont.truetype(BOLD if bold else REG, size)


# ---------- Drawing helpers ----------

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


def draw_checkmark(draw, cx, cy, size=28, color=None, width=9):
    """Bold checkmark using two line segments — no font/unicode needed."""
    if color is None:
        color = ORANGE
    x0, y0 = cx - size, cy
    xm, ym = cx - size // 3, cy + size
    x1, y1 = cx + size, cy - size
    draw.line([(x0, y0), (xm, ym)], fill=color, width=width)
    draw.line([(xm, ym), (x1, y1)], fill=color, width=width)


def wrap_to_width(draw, text, fnt, max_w):
    """Greedy word-wrap that returns a list of lines fitting within max_w."""
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        candidate = (cur + " " + w).strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_w:
            cur = candidate
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def paste_logo(img_rgb, xy, size=140):
    """Paste NWM logo onto an RGB image at (x, y) with given width/height px."""
    logo = Image.open(LOGO_256).convert("RGBA")
    logo = logo.resize((size, size), Image.LANCZOS)
    rgba = img_rgb.convert("RGBA") if img_rgb.mode != "RGBA" else img_rgb
    rgba.paste(logo, xy, logo)
    return rgba


# ---------- Overlay builders (per shot) ----------

def overlay_1_host(service):
    """Shot 1 — hook question composited over host portrait.
    RGBA. Dark dim, logo top-right, hook centered, small URL bottom.
    """
    img = Image.new("RGBA", (W, H), (4, 8, 24, 130))

    # Logo top-right
    logo_size = 140
    pad = 80
    img = paste_logo(img, (W - logo_size - pad, pad), size=logo_size)
    d = ImageDraw.Draw(img)

    # Hook: big, centered vertically, wrapped to ~880px width
    hook = service["hook"]
    # Start at 78px; drop to 68 or 58 if we need more than 3 lines.
    for size in (78, 72, 66, 60):
        fnt = font(size)
        lines = wrap_to_width(d, hook, fnt, 880)
        if len(lines) <= 4:
            break
    line_h = int(size * 1.15)
    total_h = line_h * len(lines)
    y0 = (H - total_h) // 2 - 40
    for i, line in enumerate(lines):
        center_text(d, y0 + i * line_h, line, fnt, WHITE)

    # Bottom URL
    center_text(d, H - 180, "netwebmedia.com", font(44, bold=False), DIM)
    return img


def overlay_2_pain(service):
    """Shot 2 — pain / context. Service title big, context line."""
    img = Image.new("RGBA", (W, H), (4, 8, 24, 150))
    d = ImageDraw.Draw(img)

    center_text(d, 360, "Meet", font(60, bold=False), DIM)

    # Big service title — orange with glow
    title = service["title"]
    for size in (200, 170, 150, 130, 110):
        fnt = font(size)
        bbox = d.textbbox((0, 0), title, font=fnt)
        tw = bbox[2] - bbox[0]
        if tw <= 980:
            break
    bbox = d.textbbox((0, 0), title, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    img = blur_glow(img, (x, 460), title, fnt, ORANGE, radius=40, alpha=210)
    d = ImageDraw.Draw(img)
    d.text((x, 460), title, font=fnt, fill=ORANGE)

    # Context line below
    subtitle = "by NetWebMedia"
    center_text(d, 460 + int(size * 1.15) + 60, subtitle, font(58, bold=False), DIM)
    return img


def overlay_3_solution(service):
    """Shot 3 — solution one-liner. Bold centered text."""
    img = Image.new("RGBA", (W, H), (4, 8, 24, 155))
    d = ImageDraw.Draw(img)

    center_text(d, 400, service["title"], font(86), ORANGE)

    # Solution descriptor pulled from the service brief — 2 short lines.
    desc = service["solution"]
    fnt = font(64)
    lines = wrap_to_width(d, desc, fnt, 940)
    line_h = int(64 * 1.25)
    y0 = 620
    for i, line in enumerate(lines[:4]):
        center_text(d, y0 + i * line_h, line, fnt, WHITE)

    center_text(d, H - 220, "All in one platform.", font(52, bold=False), DIM)
    return img


def overlay_4_features(service):
    """Shot 4 — 4-item feature checklist with orange checkmarks."""
    img = Image.new("RGBA", (W, H), (4, 8, 24, 165))
    d = ImageDraw.Draw(img)

    center_text(d, 240, "What you get.", font(84), WHITE)
    center_text(d, 360, service["title"], font(52, bold=False), ORANGE)

    items = service["features"][:4]
    # Pick a font size that keeps the longest feature <= 820px wide.
    for size in (58, 54, 50, 46, 42, 38):
        fnt = font(size)
        widths = [d.textbbox((0, 0), t, font=fnt)[2] for t in items]
        if max(widths) <= 820:
            break

    ck_size = 28
    gap = 30
    block_w = (ck_size * 2) + gap + max(widths)
    block_x = (W - block_w) // 2
    text_x = block_x + (ck_size * 2) + gap

    ys = [520, 680, 840, 1000]
    for text, y in zip(items, ys):
        line_mid_y = y + int(size * 0.55)
        draw_checkmark(d, block_x + ck_size, line_mid_y, size=ck_size, width=10)
        d.text((text_x, y), text, font=fnt, fill=WHITE)

    center_text(d, 1240, "One login. Zero bloat.", font(52, bold=False), DIM)
    return img


def overlay_5_proof(service):
    """Shot 5 — pull-quote social proof slide."""
    img = Image.new("RGBA", (W, H), (4, 10, 30, 155))
    d = ImageDraw.Draw(img)

    # Giant orange open-quote
    d.text((80, 320), '"', font=font(360), fill=ORANGE + (230,))

    headline = service.get("proof_headline", f"Your {service['title']}")
    subline = "on autopilot."

    center_text(d, 680, headline, font(96), WHITE)
    center_text(d, 820, subline, font(96), WHITE)

    # Small context below
    tag = service.get("proof_tag", "Powered by NetWebMedia AI.")
    fnt_tag = font(56, bold=False)
    lines = wrap_to_width(d, tag, fnt_tag, 900)
    line_h = int(56 * 1.25)
    y0 = 1000
    for i, line in enumerate(lines[:2]):
        center_text(d, y0 + i * line_h, line, fnt_tag, DIM)

    center_text(d, 1260, "— NetWebMedia", font(48), ORANGE)
    return img


def card_6_cta(service):
    """Shot 6 — CTA gradient card with logo, domain glow, price, orange rings."""
    img = gradient_bg()
    d = ImageDraw.Draw(img)

    # Orange radial rings from center
    for r in range(900, 200, -80):
        alpha = int(40 * (1 - r / 900))
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse(
            [(W // 2 - r, H // 2 - r), (W // 2 + r, H // 2 + r)],
            outline=ORANGE + (alpha,), width=2,
        )
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # Logo top-center
    logo = Image.open(LOGO_256).convert("RGBA")
    lw, lh = logo.size
    lx = (W - lw) // 2
    img_rgba = img.convert("RGBA")
    img_rgba.paste(logo, (lx, 240), logo)
    img = img_rgba.convert("RGB")
    d = ImageDraw.Draw(img)

    # Domain with white glow
    domain = "netwebmedia.com"
    fnt = font(104)
    bbox = d.textbbox((0, 0), domain, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    img = blur_glow(img, (x, 620), domain, fnt, WHITE, radius=16, alpha=200)
    d = ImageDraw.Draw(img)
    d.text((x, 620), domain, font=fnt, fill=WHITE)

    # Service badge
    center_text(d, 790, service["title"], font(64), ORANGE)

    # Price block
    center_text(d, 900, "Starting at", font(54, bold=False), DIM)
    center_text(d, 980, "$1,997", font(180), ORANGE)
    center_text(d, 1220, "/ month", font(52, bold=False), DIM)

    center_text(d, H - 180, "Book a call today.", font(48, bold=False), WHITE)
    return img


# ---------- Voiceover ----------

async def build_voiceover(vo_script: str, out_dir: Path):
    """Generate MP3 + return word boundaries aligned to VO_SCRIPT tokens."""
    import edge_tts

    vo_path = out_dir / "voiceover.mp3"
    communicate = edge_tts.Communicate(
        vo_script, "en-US-AriaNeural", rate="+6%", boundary="WordBoundary"
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

    # edge-tts strips punctuation — re-attach using original tokens.
    script_tokens = vo_script.split()
    aligned = []
    for i, (s, e, t) in enumerate(words):
        tok = script_tokens[i] if i < len(script_tokens) else t
        aligned.append((s, e, tok))
    print(f"  [vo] {vo_path.name}  ({len(aligned)} words, {aligned[-1][1]:.2f}s)")
    return vo_path, aligned


def compute_shot_windows(words, shot_word_starts):
    """Return [(start, end), ...] seconds for each of the 6 shots."""
    windows = []
    n = len(shot_word_starts)
    for i in range(n):
        start_idx = shot_word_starts[i]
        # Clamp to last word if the script came back shorter than expected.
        start_idx = min(start_idx, len(words) - 1)
        start_sec = 0.0 if i == 0 else words[start_idx][0]
        if i + 1 < n:
            end_idx = min(shot_word_starts[i + 1], len(words) - 1)
            end_sec = words[end_idx][0]
        else:
            end_sec = words[-1][1] + 0.5  # tail after last word
        # Guarantee each shot is at least 0.6s long to avoid moviepy barfing.
        if end_sec - start_sec < 0.6:
            end_sec = start_sec + 0.6
        windows.append((start_sec, end_sec))
    return windows


# ---------- Moviepy assembly ----------

def _photo_clip(path, dur, zoom=0.08):
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


def build_assets_for_service(service, out_dir: Path):
    """Render all 6 shot PNGs for one service. Returns dict of output paths."""
    assets = {}
    mapping = [
        ("01_host", overlay_1_host),
        ("02_pain", overlay_2_pain),
        ("03_solution", overlay_3_solution),
        ("04_features", overlay_4_features),
        ("05_proof", overlay_5_proof),
        ("06_cta", card_6_cta),
    ]
    for name, fn in mapping:
        path = out_dir / f"{name}.png"
        fn(service).save(path, "PNG")
        assets[name] = path
    return assets


def build_reel(service, assets, vo_path, shot_windows, out_dir: Path):
    from moviepy import (
        ImageClip, AudioFileClip, CompositeVideoClip,
        concatenate_videoclips,
    )
    from moviepy.video.fx import CrossFadeIn

    # Shot 1 — host portrait + hook overlay
    dur1 = shot_windows[0][1] - shot_windows[0][0]
    bg1 = _photo_clip(HOST_PORTRAIT, dur1, zoom=0.08)
    ov1 = ImageClip(str(assets["01_host"])).with_duration(dur1)
    shot1 = CompositeVideoClip([bg1, ov1], size=(W, H)).with_duration(dur1)

    # Shots 2-5 — b_roll photos + overlays
    b_roll = service["b_roll"]
    overlay_names = ["02_pain", "03_solution", "04_features", "05_proof"]
    shots_mid = []
    for i, (photo_name, ov_name) in enumerate(zip(b_roll, overlay_names)):
        dur = shot_windows[i + 1][1] - shot_windows[i + 1][0]
        photo = STOCK_DIR / photo_name
        bg = _photo_clip(photo, dur, zoom=0.10)
        ov = ImageClip(str(assets[ov_name])).with_duration(dur)
        shots_mid.append(CompositeVideoClip([bg, ov], size=(W, H)).with_duration(dur))

    # Shot 6 — CTA static card with gentle zoom
    dur6 = shot_windows[5][1] - shot_windows[5][0]
    shot6 = ImageClip(str(assets["06_cta"])).with_duration(dur6)
    shot6 = shot6.resized(lambda t, d=dur6: 1.0 + 0.07 * (t / d))
    shot6 = shot6.with_position("center")
    shot6 = CompositeVideoClip([shot6], size=(W, H)).with_duration(dur6)

    shots = [shot1, *shots_mid, shot6]
    faded = [shots[0]]
    for s in shots[1:]:
        faded.append(s.with_effects([CrossFadeIn(0.25)]))

    base = concatenate_videoclips(faded, method="compose")

    audio = AudioFileClip(str(vo_path))
    audio = audio.with_duration(min(base.duration, audio.duration))
    composed = base.with_audio(audio)

    out_path = out_dir / "reel.mp4"
    composed.write_videofile(
        str(out_path),
        fps=30,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        bitrate="6000k",
        threads=4,
    )
    print(f"  [reel] {out_path}")
    return out_path


# ---------- Service configs ----------
#
# Word-count / shot-window notes:
# Each VO script is split on whitespace (.split()) to produce tokens.
# SHOT_WORD_STARTS are 0-based indices into that token list; shot N starts
# on the token at shot_word_starts[N] and ends when shot N+1 starts.
# The final shot (CTA) must begin at "Visit" and run to end of audio.

SERVICE_CONFIGS = [
    {
        "service_id": "ai-agents",
        "title": "AI AGENTS",
        "hook": "What if your website closed deals at 3am?",
        "solution": "AI SDR, Voice AI, and Chat Agent working together — your always-on revenue team.",
        "features": [
            "AI SDR books meetings 24/7",
            "Voice AI handles inbound calls",
            "Chat Agent qualifies every lead",
            "Zero human bottlenecks",
        ],
        "proof_headline": "Your sales team",
        "proof_tag": "Always on. Never sleeps. Never misses a lead.",
        "vo_script": (
            "What if your website could close deals while you sleep. "
            "NetWebMedia AI Agents engage every visitor, qualify leads, "
            "and book meetings around the clock. "
            "Our AI SDR. "
            "Our Voice AI. "
            "Your always-on sales team — powered by the latest large language models. "
            "Visit netwebmedia dot com."
        ),
        # 46 words. "Visit" is word index 42.
        "shot_word_starts": [0, 10, 24, 27, 30, 42],
        "b_roll": [
            "auto_8849287.jpg",   # Shot 2 — robot hand / AI
            "auto_32026165.jpg",  # Shot 3 — multi-screen command station
            "auto_7693142.jpg",   # Shot 4 — laptop analytics dashboard
            "m_6937860.jpg",      # Shot 5 — man at startup desk
        ],
    },
    {
        "service_id": "aeo-seo",
        "title": "AEO + AI SEO",
        "hook": "Will ChatGPT recommend YOUR brand?",
        "solution": "Get cited by ChatGPT, Gemini, Claude, and Perplexity — and rank top 3 on Google.",
        "features": [
            "Cited by ChatGPT & Perplexity",
            "Ranked on Google top 3",
            "AI content engine 40+ pieces/mo",
            "AEO score tracked in real time",
        ],
        "proof_headline": "Your brand",
        "proof_tag": "Found everywhere your buyers are searching.",
        "vo_script": (
            "When someone asks ChatGPT or Perplexity for the best marketing solution — "
            "will they find you. "
            "NetWebMedia's AEO engine gets your brand cited across every major AI platform — "
            "ChatGPT, Gemini, Claude, and Perplexity — "
            "plus dominates Google with our AI content factory. "
            "Get found everywhere your buyers are searching. "
            "Visit netwebmedia dot com."
        ),
        # 54 words. "Visit" is word index 50.
        # Shot plan:
        #   1 (0-15):  hook question "When someone...find you."
        #   2 (16-27): "NetWebMedia's AEO engine...AI platform"
        #   3 (28-42): "— ChatGPT, Gemini, Claude, and Perplexity — plus...content factory."
        #   4 (43-46): "Get found everywhere your"
        #   5 (47-49): "buyers are searching."
        #   6 (50):    "Visit netwebmedia dot com."
        "shot_word_starts": [0, 16, 28, 43, 47, 50],
        "b_roll": [
            "w_3861958.jpg",      # Shot 2 — woman at dual monitors
            "auto_7693142.jpg",   # Shot 3 — analytics dashboard
            "auto_32026165.jpg",  # Shot 4 — command station
            "photo_7688336.jpg",  # Shot 5 — overhead marketing meeting
        ],
    },
    {
        "service_id": "crm",
        "title": "CRM PLATFORM",
        "hook": "46 modules. One login. Zero subscriptions.",
        "solution": "Sales, Marketing, Service, AI, CMS, Automations, Reporting — all under one roof.",
        "features": [
            "Sales + Marketing + Service hubs",
            "AI lead scoring and forecasting",
            "White-label ready — resell at your price",
            "Replaces HubSpot + 5 other tools",
        ],
        "proof_headline": "Your whole stack",
        "proof_tag": "One login. Your brand. Your margin.",
        "vo_script": (
            "Seven hubs. One login. "
            "Your entire marketing stack — CRM, automations, email, AI agents, "
            "and a full CMS — all in one platform. "
            "Forty-six live modules. Replace five tools with one. "
            "And it is fully white-label, so you can resell it under your brand at any price. "
            "Visit netwebmedia dot com."
        ),
        # 51 words. "Visit" is word index 47.
        # Shot plan:
        #   1 (0-3):   hook "Seven hubs. One login."
        #   2 (4-22):  "Your entire marketing stack...one platform."
        #   3 (23-25): "Forty-six live modules."
        #   4 (26-30): "Replace five tools with one."
        #   5 (31-46): "And it is fully white-label...any price."
        #   6 (47):    "Visit netwebmedia dot com."
        "shot_word_starts": [0, 4, 23, 26, 31, 47],
        "b_roll": [
            "photo_7688336.jpg",  # Shot 2 — overhead meeting
            "auto_7693142.jpg",   # Shot 3 — analytics dashboard
            "auto_32026165.jpg",  # Shot 4 — multi-screen command station
            "m_6937860.jpg",      # Shot 5 — man at startup desk
        ],
    },
    {
        "service_id": "paid-ads",
        "title": "PAID ADS AI",
        "hook": "Your ad budget is being wasted. We fix that.",
        "solution": "AI-optimized campaigns on Google, Meta, TikTok, and LinkedIn — with creatives tested 24/7.",
        "features": [
            "Google, Meta, TikTok, LinkedIn",
            "AI creative testing 24/7",
            "Real-time ROAS optimization",
            "Predictive audience targeting",
        ],
        "proof_headline": "Your ad spend",
        "proof_tag": "Every dollar working harder, every day.",
        "vo_script": (
            "Stop guessing with your ad budget. "
            "NetWebMedia runs AI-optimized Google, Meta, TikTok, and LinkedIn campaigns — "
            "with real-time ROAS tracking and continuous creative testing. "
            "Our AI finds what converts and doubles down automatically. "
            "Every dollar works harder. "
            "Visit netwebmedia dot com."
        ),
        # 41 words. "Visit" is word index 37.
        # Shot plan:
        #   1 (0-5):   hook "Stop guessing...ad budget."
        #   2 (6-15):  "NetWebMedia runs AI-optimized...campaigns —"
        #   3 (16-23): "with real-time ROAS tracking...creative testing."
        #   4 (24-32): "Our AI finds what converts...automatically."
        #   5 (33-36): "Every dollar works harder."
        #   6 (37):    "Visit netwebmedia dot com."
        "shot_word_starts": [0, 6, 16, 24, 33, 37],
        "b_roll": [
            "auto_8849287.jpg",    # Shot 2 — robot hand
            "auto_7693142.jpg",    # Shot 3 — analytics dashboard
            "auto_32026165.jpg",   # Shot 4 — command station
            "sleep_31964019.jpg",  # Shot 5 — cafe laptop workspace
        ],
    },
    {
        "service_id": "ai-websites",
        "title": "AI WEBSITES",
        "hook": "Your website should be selling while you sleep.",
        "solution": "Personalized per visitor, A/B testing built in, conversion AI baked into the stack.",
        "features": [
            "AI personalization per visitor",
            "Real-time A/B testing built in",
            "Predictive content & conversion AI",
            "Launched in days, not months",
        ],
        "proof_headline": "Your website",
        "proof_tag": "A 24/7 sales machine. Not a brochure.",
        "vo_script": (
            "Your website should be a revenue engine — not a digital brochure. "
            "NetWebMedia builds AI-powered websites that personalize every visitor's experience "
            "in real time, with live A/B testing and conversion optimization built in. "
            "Not just a website. A 24/7 sales machine. "
            "Visit netwebmedia dot com."
        ),
        # 45 words. "Visit" is word index 41.
        # Shot plan:
        #   1 (0-11):  hook "Your website...digital brochure."
        #   2 (12-23): "NetWebMedia builds AI-powered...in real time,"
        #   3 (24-32): "with live A/B testing...built in."
        #   4 (33-36): "Not just a website."
        #   5 (37-40): "A 24/7 sales machine."
        #   6 (41):    "Visit netwebmedia dot com."
        "shot_word_starts": [0, 12, 24, 33, 37, 41],
        "b_roll": [
            "w_3861958.jpg",       # Shot 2 — woman at dual monitors
            "auto_7693142.jpg",    # Shot 3 — analytics dashboard
            "sleep_31964019.jpg",  # Shot 4 — cafe laptop workspace
            "m_6937860.jpg",       # Shot 5 — man at startup desk
        ],
    },
]


# ---------- Per-service orchestrator ----------

def build_service(service):
    sid = service["service_id"]
    out_dir = OUT_ROOT / sid
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n== {sid.upper()} ==")

    # 1. Render overlay PNGs
    assets = build_assets_for_service(service, out_dir)
    for name, p in assets.items():
        print(f"  [asset] {p.name}  ({p.stat().st_size / 1024:.0f} KB)")

    # 2. Voiceover + word boundaries
    vo_path, words = asyncio.run(build_voiceover(service["vo_script"], out_dir))

    # 3. Shot windows
    windows = compute_shot_windows(words, service["shot_word_starts"])
    for i, (s, e) in enumerate(windows, 1):
        print(f"  [shot {i}] {s:6.2f}s -> {e:6.2f}s  ({e - s:.2f}s)")

    # 4. Assemble reel
    reel = build_reel(service, assets, vo_path, windows, out_dir)
    print(f"  DONE: {reel}  ({reel.stat().st_size / 1024 / 1024:.1f} MB)")
    return reel


# ---------- Main ----------

def main():
    print("== NetWebMedia Service Reels builder ==")
    print(f"Output root: {OUT_ROOT}")
    print(f"Stock dir:   {STOCK_DIR}")
    print(f"Host image:  {HOST_PORTRAIT}")

    # Sanity checks up front — surface missing inputs before we spend any time.
    missing = []
    if not HOST_PORTRAIT.exists():
        missing.append(str(HOST_PORTRAIT))
    if not LOGO_256.exists():
        missing.append(str(LOGO_256))
    for svc in SERVICE_CONFIGS:
        for photo in svc["b_roll"]:
            p = STOCK_DIR / photo
            if not p.exists():
                missing.append(str(p))
    if missing:
        print("\nMISSING INPUTS — aborting:")
        for m in sorted(set(missing)):
            print(f"  - {m}")
        return

    results = []
    for svc in SERVICE_CONFIGS:
        try:
            reel = build_service(svc)
            results.append((svc["service_id"], "ok", str(reel)))
        except Exception as exc:  # one failure must not block the others
            print(f"\n!! FAILED: {svc['service_id']}: {exc}")
            traceback.print_exc()
            results.append((svc["service_id"], "failed", str(exc)))

    print("\n== SUMMARY ==")
    for sid, status, info in results:
        tag = "OK  " if status == "ok" else "FAIL"
        print(f"  [{tag}] {sid:14s}  {info}")


if __name__ == "__main__":
    main()

from __future__ import annotations

from pathlib import Path
import re
import sys


SITE_ROOT = Path(r"C:\Users\Usuario\Downloads\Netwebmedia antigravity - Copy")


def repair_token(token: str) -> str:
    try:
        repaired = token.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return token
    return repaired


def repair_text(text: str) -> str:
    token_pattern = re.compile(r"[^\s<>\"]*[ÃâðÂ][^\s<>\"]*")
    text = token_pattern.sub(lambda m: repair_token(m.group(0)), text)

    text = re.sub(
        r'<button class="lang-btn active" data-lang="en" id="lang-en">\s*<span class="flag">.*?</span>\s*English\s*</button>',
        '<button class="lang-btn active" data-lang="en" id="lang-en">\n      English\n    </button>',
        text,
        flags=re.S,
    )
    text = re.sub(
        r'<button class="lang-btn" data-lang="es" id="lang-es">\s*<span class="flag">.*?</span>\s*Español\s*</button>',
        '<button class="lang-btn" data-lang="es" id="lang-es">\n      Español\n    </button>',
        text,
        flags=re.S,
    )

    replacements = {
        "?? Top AI Marketing Agency 2025": "Top AI Marketing Agency 2025",
        '<div class="logo-icon">??</div>': '<div class="logo-icon">🌐</div>',
        'form_privacy_note: "?? 100% confidential. We never share your information."':
            'form_privacy_note: "100% confidential. We never share your information."',
        "Learn More ?": "Learn More →",
        "Explore Services ?": "Explore Services ↓",
        "Send Message & Get Free Audit ?": "Send Message & Get Free Audit →",
        "Sent! ?": "Sent! ✓",
        "4.9?": "4.9★",
        "ï¿½": "-",
        "�": "-",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)

    return text


def main() -> int:
    if not SITE_ROOT.exists():
        print(f"Site root not found: {SITE_ROOT}", file=sys.stderr)
        return 1

    for path in SITE_ROOT.rglob("*"):
        if path.suffix.lower() not in {".html", ".js", ".css"}:
            continue
        original = path.read_text(encoding="utf-8", errors="replace")
        fixed = repair_text(original)
        if fixed != original:
            path.write_text(fixed, encoding="utf-8", newline="")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

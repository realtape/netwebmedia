"""
One-shot fix for NetWebMedia industry landing pages (68 files).

Pass 1: Force provider.@type to "ProfessionalService" inside the existing
        Service JSON-LD block (was incorrectly mapped to LegalService,
        Restaurant, LodgingBusiness, etc.).

Pass 2: If the page has >=3 <details>/<summary> FAQ blocks and no FAQPage
        schema yet, build one and inject it right after the Service block.
"""
import json
import os
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent
ROOT = REPO / "industries"

LD_RE = re.compile(
    r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>',
    re.DOTALL,
)
DETAILS_RE = re.compile(r"<details\b[^>]*>(.*?)</details>", re.DOTALL | re.IGNORECASE)
SUMMARY_RE = re.compile(r"<summary\b[^>]*>(.*?)</summary>", re.DOTALL | re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def strip_html(s: str) -> str:
    s = TAG_RE.sub(" ", s)
    s = s.replace("&nbsp;", " ").replace("&amp;", "&")
    s = s.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&#39;", "'")
    return WS_RE.sub(" ", s).strip()


def extract_faqs(html: str):
    faqs = []
    for d_match in DETAILS_RE.finditer(html):
        inner = d_match.group(1)
        s_match = SUMMARY_RE.search(inner)
        if not s_match:
            continue
        question = strip_html(s_match.group(1))
        # Answer = everything in <details> minus <summary>
        answer_html = inner[: s_match.start()] + inner[s_match.end() :]
        answer = strip_html(answer_html)
        if question and answer:
            faqs.append((question, answer))
    return faqs


def fix_provider(html: str):
    """Find the Service JSON-LD block; rewrite provider.@type to ProfessionalService.
    Returns (new_html, changed_bool, service_block_end_idx)."""
    changed = False
    end_idx = -1
    for m in LD_RE.finditer(html):
        raw = m.group(1)
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if not isinstance(obj, dict):
            continue
        if obj.get("@type") != "Service":
            # Not the Service block — could be FAQPage already, etc.
            if obj.get("@type") == "FAQPage":
                end_idx = m.end()  # remember last ld+json block end
            continue
        provider = obj.get("provider")
        new_raw = raw
        if isinstance(provider, dict) and provider.get("@type") != "ProfessionalService":
            provider["@type"] = "ProfessionalService"
            new_raw = json.dumps(obj, indent=2, ensure_ascii=False)
            changed = True
            html = html[: m.start(1)] + new_raw + html[m.end(1) :]
            # recompute end position of this script tag
            new_end = m.start(1) + len(new_raw) + len("</script>")
            # Easier: re-find
        # Find the end of the </script> for this Service block in updated html
        # Re-search for the updated block to get its </script> end:
        m2 = re.search(
            r'<script type="application/ld\+json">\s*' + re.escape(new_raw) + r'\s*</script>',
            html,
            re.DOTALL,
        )
        if m2:
            end_idx = m2.end()
        break
    return html, changed, end_idx


def has_faqpage(html: str) -> bool:
    for m in LD_RE.finditer(html):
        try:
            obj = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict) and obj.get("@type") == "FAQPage":
            return True
    return False


def build_faqpage(faqs):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in faqs
        ],
    }


def process_file(path: Path):
    html = path.read_text(encoding="utf-8")
    original = html

    html, provider_changed, service_end = fix_provider(html)

    faq_added = False
    skip_reason = None
    faqs = extract_faqs(html)
    if has_faqpage(html):
        skip_reason = "faq-already-present"
    elif len(faqs) < 3:
        skip_reason = f"only-{len(faqs)}-details-blocks"
    elif service_end < 0:
        skip_reason = "no-service-block-anchor"
    else:
        block = build_faqpage(faqs)
        injected = (
            "\n<script type=\"application/ld+json\">\n"
            + json.dumps(block, indent=2, ensure_ascii=False)
            + "\n</script>"
        )
        html = html[:service_end] + injected + html[service_end:]
        faq_added = True

    if html != original:
        path.write_text(html, encoding="utf-8")

    return provider_changed, faq_added, skip_reason, len(faqs)


def main():
    files = sorted(ROOT.rglob("index.html"))
    # Skip the top-level hub (industries/index.html)
    files = [f for f in files if f.parent != ROOT]

    total = 0
    provider_fixes = 0
    faq_added = 0
    skipped = []
    for f in files:
        total += 1
        try:
            pc, fa, reason, n = process_file(f)
        except Exception as e:
            skipped.append((f, f"error: {e}"))
            continue
        if pc:
            provider_fixes += 1
        if fa:
            faq_added += 1
        else:
            skipped.append((f, reason or "no-change"))

    print(f"Files processed: {total}")
    print(f"Provider type fixes: {provider_fixes}")
    print(f"FAQPage blocks added: {faq_added}")
    print(f"Skipped FAQ injection: {len(skipped)}")
    for f, r in skipped:
        rel = f.relative_to(REPO).as_posix()
        print(f"  - {rel}: {r}")


if __name__ == "__main__":
    main()

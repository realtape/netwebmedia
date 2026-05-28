"""One-shot backfill: inject FAQPage JSON-LD into every blog/*.html that doesn't
already have it. Mirrors the h2->question logic from _deploy/generate-blogs.js
so output is consistent between backfilled posts and newly-generated ones.

Identification & overwrite policy:
  - "nwm-auto-faq:start" sentinel comment marks blocks this script produced.
    Re-runs strip the sentinel-marked block and re-inject (so grammar / template
    fixes propagate cleanly).
  - The pre-sentinel v1 backfill (commit 54cf9d5ee) is detected by the templated
    closer signature "How quickly will I see results from this?" and is treated
    as overwriteable.
  - Hand-crafted FAQPage blocks (no sentinel, no v1 signature) are LEFT ALONE.

Run: python3 _deploy/_inject_blog_faq.py
"""
import os, re, glob, json, html

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
BLOG_DIR = os.path.join(ROOT, 'blog')

H2_QWORDS = re.compile(r'^(how|what|why|when|who|where|is|are|can|do|does|should|will)\b', re.I)
THE_PREFIX = re.compile(r'^the\s', re.I)
PLURAL_END = re.compile(r's$')
SINGULAR_S_END = re.compile(r'(ss|us|is|os)$')

# Signature of the v1 auto-derived block — sentinel was not added in v1.
V1_SIGNATURE = 'How quickly will I see results from this?'

# Regex to strip an existing sentinel-marked block (v2+).
SENTINEL_BLOCK = re.compile(
    r'\s*<!--\s*nwm-auto-faq:start[^>]*-->.*?<!--\s*nwm-auto-faq:end\s*-->',
    re.DOTALL,
)

# Regex to strip a v1 FAQPage script (no sentinel) when it contains V1_SIGNATURE.
# We match the whole <script type="application/ld+json">...</script> that has
# both "FAQPage" and the closer signature.
V1_BLOCK = re.compile(
    r'\s*<script[^>]+type="application/ld\+json"[^>]*>\s*\{[^<]*"FAQPage"[^<]*</script>',
    re.DOTALL | re.I,
)


def is_plural_topic(s: str) -> bool:
    t = (s or '').strip().lower().rstrip('?')
    if not t.endswith('s'):
        return False
    if SINGULAR_S_END.search(t):
        return False
    return True


def h2_to_question(h2: str) -> str:
    t = re.sub(r'\s+', ' ', h2).strip()
    if H2_QWORDS.match(t):
        return t if t.endswith('?') else t + '?'
    lower = (t[:1].lower() + t[1:]).rstrip('?')
    if THE_PREFIX.match(t):
        # Strip leading "the " for plural detection
        bare = re.sub(r'^the\s+', '', lower, flags=re.I)
        verb = 'are' if is_plural_topic(bare) else 'is'
        return f'What {verb} {lower}?'
    return f'How do you {lower}?'


def strip_html(s: str) -> str:
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()


def derive_title_topic(title: str) -> str:
    # "Furniture Stores: How to Own Local Search — NetWebMedia Blog"
    # → split on em-dash or colon, take first chunk
    parts = re.split(r'\s*[—–:]\s*', title, maxsplit=1)
    topic = parts[0].strip()
    # Strip trailing " - NetWebMedia Blog" if it survived
    topic = re.sub(r'\s*[-—]\s*NetWebMedia.*$', '', topic, flags=re.I).strip()
    return topic


def build_faqs(title: str, description: str, h2_pairs: list) -> list:
    faqs = []
    topic = derive_title_topic(title)
    if topic and description:
        verb = 'are' if is_plural_topic(topic) else 'is'
        faqs.append({'q': f'What {verb} {topic}?', 'a': description})
    for h2, first_p in h2_pairs[:3]:
        if h2 and first_p:
            faqs.append({'q': h2_to_question(h2), 'a': first_p})
    if len(faqs) < 5:
        faqs.append({
            'q': V1_SIGNATURE,
            'a': 'Most NetWebMedia clients see measurable progress within 30-60 days. AEO and SEO compound - month-1 wins are foundation; months 3-6 are when citation and ranking effects materially impact lead volume. See our results page for case studies.'
        })
    return faqs[:5]


def faq_json_ld(faqs: list) -> str:
    entities = []
    for f in faqs:
        entities.append(
            '    {\n'
            '      "@type": "Question",\n'
            f'      "name": {json.dumps(f["q"], ensure_ascii=False)},\n'
            '      "acceptedAnswer": {\n'
            '        "@type": "Answer",\n'
            f'        "text": {json.dumps(f["a"], ensure_ascii=False)}\n'
            '      }\n'
            '    }'
        )
    return (
        '\n  <!-- nwm-auto-faq:start v2 -->\n'
        '  <script type="application/ld+json">\n'
        '{\n'
        '  "@context": "https://schema.org",\n'
        '  "@type": "FAQPage",\n'
        '  "mainEntity": [\n'
        + ',\n'.join(entities) + '\n'
        '  ]\n'
        '}\n'
        '  </script>\n'
        '  <!-- nwm-auto-faq:end -->'
    )


def extract_h2_pairs(src: str) -> list:
    pairs = []
    h2_re = re.compile(r'<h2[^>]*>(.*?)</h2>', re.S | re.I)
    for m in h2_re.finditer(src):
        h2_text = strip_html(m.group(1))
        after = src[m.end(): m.end() + 4000]
        next_h2 = re.search(r'<h2[^>]*>', after, re.I)
        scan_end = next_h2.start() if next_h2 else len(after)
        p_m = re.search(r'<p[^>]*>(.*?)</p>', after[:scan_end], re.S | re.I)
        if p_m:
            p_text = strip_html(p_m.group(1))
            if h2_text and p_text:
                pairs.append((h2_text, p_text))
    return pairs


SCRIPT_LD_PATTERN = re.compile(
    r'\s*<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
    re.DOTALL | re.I,
)


def detect_existing(src: str) -> str:
    """Returns:
      'sentinel'     — v2 sentinel-wrapped block present
      'v1'           — bare FAQPage script with V1_SIGNATURE (no sentinel)
      'handcrafted'  — FAQPage present but neither marker (legacy curated)
      'none'         — no FAQPage at all
    Sentinel takes priority — caller should still scan for & strip stray v1
    blocks if both sentinel and v1 coexist (cleanup pass)."""
    has_sentinel = bool(SENTINEL_BLOCK.search(src))
    has_v1_faq = False
    for m in SCRIPT_LD_PATTERN.finditer(src):
        blob = m.group(1)
        if 'FAQPage' in blob and V1_SIGNATURE in blob and not _block_is_inside_sentinel(src, m.start(), m.end()):
            has_v1_faq = True
            break
    if has_sentinel:
        return 'sentinel'
    if has_v1_faq:
        return 'v1'
    if 'FAQPage' in src:
        return 'handcrafted'
    return 'none'


def _block_is_inside_sentinel(src: str, start: int, end: int) -> bool:
    """True if the [start, end) span is enclosed by an nwm-auto-faq sentinel."""
    m = SENTINEL_BLOCK.search(src)
    if not m:
        return False
    return m.start() <= start and end <= m.end()


def _strip_v1_blocks(src: str) -> tuple:
    """Remove every JSON-LD script that contains FAQPage + V1_SIGNATURE and is
    NOT inside an nwm-auto-faq sentinel. Returns (new_src, count_removed)."""
    out = []
    last = 0
    removed = 0
    for m in SCRIPT_LD_PATTERN.finditer(src):
        blob = m.group(1)
        if (
            'FAQPage' in blob
            and V1_SIGNATURE in blob
            and not _block_is_inside_sentinel(src, m.start(), m.end())
        ):
            # Skip this script — append everything up to its start, then jump past it
            out.append(src[last:m.start()])
            last = m.end()
            removed += 1
    out.append(src[last:])
    return ''.join(out), removed


def strip_existing(src: str, kind: str) -> str:
    if kind == 'sentinel':
        # Remove the sentinel block; also sweep any stray v1 leftovers
        src = SENTINEL_BLOCK.sub('', src, count=1)
        src, _ = _strip_v1_blocks(src)
        return src
    if kind == 'v1':
        src, _ = _strip_v1_blocks(src)
        return src
    return src


def process_file(path: str) -> str:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            src = f.read()
    except UnicodeDecodeError:
        try:
            with open(path, 'r', encoding='cp1252') as f:
                src = f.read()
        except Exception:
            return 'read-err'
    except Exception:
        return 'read-err'

    existing = detect_existing(src)
    if existing == 'handcrafted':
        return 'skip-handcrafted'
    if '</head>' not in src:
        return 'no-head'

    title_m = re.search(r'<title[^>]*>(.*?)</title>', src, re.S | re.I)
    desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', src, re.I)
    title = strip_html(title_m.group(1)) if title_m else ''
    description = html.unescape(desc_m.group(1)) if desc_m else ''
    h2_pairs = extract_h2_pairs(src)

    if not title:
        return 'no-title'
    if not description and not h2_pairs:
        return 'no-content'

    # If a prior auto-derived block exists, strip it first.
    if existing in ('sentinel', 'v1'):
        src = strip_existing(src, existing)

    faqs = build_faqs(title, description, h2_pairs)
    if not faqs:
        return 'no-faqs-built'

    block = faq_json_ld(faqs)
    new_src = src.replace('</head>', block + '\n</head>', 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_src)

    return f'patched-from-{existing}'


def main():
    targets = sorted(glob.glob(os.path.join(BLOG_DIR, '*.html')))
    counts = {}
    for p in targets:
        result = process_file(p)
        counts[result] = counts.get(result, 0) + 1
    print(f'Targets scanned: {len(targets)}')
    for k in sorted(counts):
        print(f'  {k}: {counts[k]}')


if __name__ == '__main__':
    main()

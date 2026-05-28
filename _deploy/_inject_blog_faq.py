"""One-shot backfill: inject FAQPage JSON-LD into every blog/*.html that doesn't
already have it. Mirrors the h2→question logic from _deploy/generate-blogs.js so
output is consistent between backfilled posts and newly-generated ones.

For each post:
  - Parse <title> and <meta name="description">
  - Extract h2 headers + their first <p> as Q&A candidates
  - Build 3–5 FAQ pairs:
      1. "What is [title-derived noun phrase]?" → meta description
      2–4. Up to 3 h2 sections → h2ToQuestion(h2) + first paragraph
      5. Generic closer if fewer than 5 collected
  - Inject FAQPage JSON-LD before </head>

Idempotent — skips files already containing FAQPage.

Run: python3 _deploy/_inject_blog_faq.py
"""
import os, re, glob, json, html

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
BLOG_DIR = os.path.join(ROOT, 'blog')

H2_QWORDS = re.compile(r'^(how|what|why|when|who|where|is|are|can|do|does|should|will)\b', re.I)
THE_PREFIX = re.compile(r'^the\s', re.I)


def h2_to_question(h2: str) -> str:
    t = re.sub(r'\s+', ' ', h2).strip()
    if H2_QWORDS.match(t):
        return t if t.endswith('?') else t + '?'
    lower = (t[:1].lower() + t[1:]).rstrip('?')
    if THE_PREFIX.match(t):
        return f'What are {lower}?'
    return f'How do you {lower}?'


def strip_html(s: str) -> str:
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()


def derive_title_topic(title: str) -> str:
    # title like "Furniture Stores: How to Own Local Search — NetWebMedia Blog"
    # → split on em-dash or colon, take first chunk
    parts = re.split(r'\s*[—–:]\s*', title, maxsplit=1)
    return parts[0].strip()


def build_faqs(title: str, description: str, h2_pairs: list) -> list:
    faqs = []
    topic = derive_title_topic(title)
    if topic and description:
        faqs.append({'q': f'What is {topic}?', 'a': description})
    for h2, first_p in h2_pairs[:3]:
        if h2 and first_p:
            faqs.append({'q': h2_to_question(h2), 'a': first_p})
    if len(faqs) < 5:
        faqs.append({
            'q': 'How quickly will I see results from this?',
            'a': 'Most NetWebMedia clients see measurable progress within 30–60 days. AEO and SEO compound — month-1 wins are foundation; months 3–6 are when citation and ranking effects materially impact lead volume. See our results page for case studies.'
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
        '\n  <script type="application/ld+json">\n'
        '{\n'
        '  "@context": "https://schema.org",\n'
        '  "@type": "FAQPage",\n'
        '  "mainEntity": [\n'
        + ',\n'.join(entities) + '\n'
        '  ]\n'
        '}\n'
        '  </script>'
    )


def extract_h2_pairs(src: str) -> list:
    """Find each <h2>...</h2> and the first <p>...</p> that follows it (within
    a reasonable window). Returns list of (h2_text, first_p_text) tuples,
    both stripped of HTML tags."""
    pairs = []
    h2_re = re.compile(r'<h2[^>]*>(.*?)</h2>', re.S | re.I)
    for m in h2_re.finditer(src):
        h2_text = strip_html(m.group(1))
        # Look for the next <p> within a 4000-char window
        after = src[m.end(): m.end() + 4000]
        # Stop if next h2 appears first
        next_h2 = re.search(r'<h2[^>]*>', after, re.I)
        scan_end = next_h2.start() if next_h2 else len(after)
        p_m = re.search(r'<p[^>]*>(.*?)</p>', after[:scan_end], re.S | re.I)
        if p_m:
            p_text = strip_html(p_m.group(1))
            if h2_text and p_text:
                pairs.append((h2_text, p_text))
    return pairs


def process_file(path: str) -> str:
    """Returns one of: 'patched', 'already-has-faq', 'no-head', 'no-title',
    'no-description', 'no-h2-and-no-desc', 'read-err'."""
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

    if 'FAQPage' in src:
        return 'already-has-faq'
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
        return 'no-h2-and-no-desc'

    faqs = build_faqs(title, description, h2_pairs)
    if not faqs:
        return 'no-faqs-built'

    block = faq_json_ld(faqs)
    new_src = src.replace('</head>', block + '\n</head>', 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_src)
    return 'patched'


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

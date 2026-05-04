#!/usr/bin/env python3
"""
Blog i18n — Option B: H1 title + H2/H3 headings + CTA box (h3 + p) via Claude Haiku.

Processes all 268 blog posts in parallel batches of 20.
Skips natively Spanish posts and elements already having data-en.
Writes data-en / data-es attributes in-place, then commits in batches of 25.

Usage:
    python _deploy/blog-i18n-b-headings.py
    python _deploy/blog-i18n-b-headings.py --dry-run   (print first 3 posts, no writes)

Requirements:
    pip install anthropic
    ANTHROPIC_API_KEY env var (or set below)
"""
import re, sys, json, textwrap, concurrent.futures, subprocess, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT / 'blog'
DRY_RUN = '--dry-run' in sys.argv

# Pull key from env or local config
try:
    import anthropic
    API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
    if not API_KEY:
        cfg = ROOT / 'api-php' / 'config.local.php'
        if cfg.exists():
            m = re.search(r"ANTHROPIC_API_KEY['\"]?\s*,\s*['\"]([^'\"]+)['\"]", cfg.read_text())
            if m: API_KEY = m.group(1)
except ImportError:
    print('ERROR: pip install anthropic'); sys.exit(1)

SPANISH_INDICATORS = ['Servicios</a>', 'Nosotros</a>', 'data-es="Todos los artículos"',
                      'Caso de Estudio', 'caso-aeo', 'fractional-cmo-vs-agencia']

# ── Extraction patterns ───────────────────────────────────────────────────
H1_RE    = re.compile(r'(<h1(?:[^>]*)>)((?:(?!data-es).)*?)(</h1>)', re.DOTALL)
H2_RE    = re.compile(r'(<h2(?:[^>]*)>)((?:(?!data-es).)*?)(</h2>)', re.DOTALL)
H3_RE    = re.compile(r'(<h3(?:[^>]*)>)((?:(?!data-es).)*?)(</h3>)', re.DOTALL)
CTA_H3_RE = re.compile(
    r'(<div class="article-cta-box">.*?<h3(?:[^>]*)>)((?:(?!data-es).)*?)(</h3>)',
    re.DOTALL)
CTA_P_RE  = re.compile(
    r'(<div class="article-cta-box">.*?</h3>\s*<p(?:[^>]*)>)((?:(?!data-es).)*?)(</p>)',
    re.DOTALL)


def extract_texts(html: str) -> list[str]:
    """Return list of unique plain-text strings to translate."""
    texts = set()
    for pat in (H1_RE, H2_RE, CTA_H3_RE, CTA_P_RE):
        for m in pat.finditer(html):
            raw = m.group(2).strip()
            plain = re.sub(r'<[^>]+>', '', raw).strip()
            if plain and len(plain) > 3:
                texts.add(plain)
    return sorted(texts)


def call_haiku(texts: list[str]) -> dict[str, str]:
    """Translate a list of strings to Latam Spanish via Claude Haiku.
    Returns {english: spanish} mapping."""
    if not texts:
        return {}
    client = anthropic.Anthropic(api_key=API_KEY)
    payload = json.dumps(texts, ensure_ascii=False, indent=2)
    prompt = textwrap.dedent(f"""
        Translate the following English marketing strings to Latam Spanish (Chilean register).
        Rules:
        - Product/tool names stay in English: CRM, AEO, SEO, AI, ChatGPT, Perplexity, etc.
        - No vosotros. Use tú or usted (formal preferred for B2B).
        - Preserve → arrows, ← arrows, punctuation, and HTML entities (&amp; etc.).
        - Return a JSON object mapping each English string to its Spanish translation.
        - No extra keys, no explanations — pure JSON only.

        Strings to translate:
        {payload}
    """).strip()

    msg = client.messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=4096,
        messages=[{'role': 'user', 'content': prompt}]
    )
    raw = msg.content[0].text.strip()
    # Strip markdown code block if present
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)


def inject_translations(html: str, tmap: dict[str, str]) -> str:
    """Add data-en / data-es to each matching element."""

    def do_replace(m, tmap):
        open_tag, content, close_tag = m.group(1), m.group(2), m.group(3)
        # Skip if already bilingual
        if 'data-es' in open_tag:
            return m.group(0)
        plain = re.sub(r'<[^>]+>', '', content).strip()
        es = tmap.get(plain)
        if not es:
            return m.group(0)
        en_attr = plain.replace('"', '&quot;')
        es_attr = es.replace('"', '&quot;')
        # Insert data-en/data-es before the closing > of the opening tag
        new_open = re.sub(r'>$', f' data-en="{en_attr}" data-es="{es_attr}">', open_tag)
        return new_open + content + close_tag

    for pat in (H1_RE, H2_RE, H3_RE):
        html = pat.sub(lambda m: do_replace(m, tmap), html)
    # CTA p — handle separately (CTA_P_RE starts from cta-box, captures content after </h3>)
    def inject_cta_p(m):
        prefix, content, close = m.group(1), m.group(2), m.group(3)
        if 'data-es' in prefix:
            return m.group(0)
        plain = re.sub(r'<[^>]+>', '', content).strip()
        es = tmap.get(plain)
        if not es:
            return m.group(0)
        en_attr = plain.replace('"', '&quot;')
        es_attr = es.replace('"', '&quot;')
        # The <p> tag is inside `prefix` — insert attrs
        new_prefix = re.sub(r'(<p)([^>]*>)$', rf'\1 data-en="{en_attr}" data-es="{es_attr}"\2', prefix)
        return new_prefix + content + close
    html = CTA_P_RE.sub(inject_cta_p, html)
    return html


def process_file(html_path: Path) -> tuple[str, int]:
    """Process one file. Returns (filename, changes_count)."""
    try:
        text = html_path.read_text(encoding='utf-8')
        if any(s in text for s in SPANISH_INDICATORS):
            return (html_path.name, -1)  # -1 = skipped
        texts = extract_texts(text)
        if not texts:
            return (html_path.name, 0)
        tmap = call_haiku(texts)
        new_text = inject_translations(text, tmap)
        if new_text != text:
            if not DRY_RUN:
                html_path.write_text(new_text, encoding='utf-8')
            return (html_path.name, len([t for t in texts if t in tmap]))
        return (html_path.name, 0)
    except Exception as e:
        return (html_path.name, f'ERROR: {e}')


def commit_batch(paths: list[Path], batch_num: int):
    rel = [str(p.relative_to(ROOT)) for p in paths]
    subprocess.run(['git', 'add'] + rel, cwd=ROOT, check=True)
    msg = f'i18n(blog-b): bilingual headings+CTAs batch {batch_num} ({len(paths)} posts)'
    subprocess.run(['git', 'commit', '-m', msg,
                    '--author=realtape <entrepoker@gmail.com>'], cwd=ROOT, check=True)


if __name__ == '__main__':
    posts = sorted(p for p in BLOG_DIR.glob('*.html'))

    if DRY_RUN:
        posts = posts[:3]
        print(f'DRY RUN — processing {len(posts)} posts (no writes, no commits)\n')

    print(f'Processing {len(posts)} blog posts with Claude Haiku...')
    if not API_KEY:
        print('ERROR: ANTHROPIC_API_KEY not found'); sys.exit(1)

    changed_paths = []
    skipped = errors = done = 0

    # Process in parallel batches of 10 (rate-limit friendly)
    BATCH = 10
    for i in range(0, len(posts), BATCH):
        chunk = posts[i:i + BATCH]
        with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH) as ex:
            futures = {ex.submit(process_file, p): p for p in chunk}
            for fut in concurrent.futures.as_completed(futures):
                name, result = fut.result()
                if result == -1:
                    skipped += 1
                elif isinstance(result, str) and result.startswith('ERROR'):
                    errors += 1
                    print(f'  ERR {name}: {result}')
                elif result > 0:
                    changed_paths.append(futures[fut])
                    done += 1
                    print(f'  OK {name} ({result} strings)')
                else:
                    print(f'  -- {name} (no changes)')

        # Commit every 25 changed files
        if not DRY_RUN and len(changed_paths) >= 25:
            batch_num = len(changed_paths) // 25
            commit_batch(changed_paths[:25], batch_num)
            changed_paths = changed_paths[25:]

    # Final commit for remainder
    if not DRY_RUN and changed_paths:
        commit_batch(changed_paths, 'final')

    print(f'\nDone. Modified: {done}, Skipped (ES): {skipped}, Errors: {errors}')

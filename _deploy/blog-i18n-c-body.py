#!/usr/bin/env python3
"""
Blog i18n — Option C: Full article body translation via Claude Haiku.

Translates all user-visible text inside <article class="article-body">:
  - <p> paragraphs
  - <li> list items
  - <blockquote> pull quotes
  - <td> table cells

Runs AFTER Option B (assumes headings already have data-en/data-es).
Skips elements already bilingual. Skips natively Spanish posts.

Usage:
    python _deploy/blog-i18n-c-body.py
    python _deploy/blog-i18n-c-body.py --dry-run

Estimated cost: ~$5-8 total at Haiku pricing for 268 posts.
Estimated time: 2-3 hours.
"""
import re, sys, json, textwrap, concurrent.futures, subprocess, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT / 'blog'
DRY_RUN = '--dry-run' in sys.argv

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

# Extract article body only — stop before comments/share/footer
ARTICLE_RE = re.compile(
    r'(<article class="article-body">)(.*?)(</article>)',
    re.DOTALL)

# Body elements to translate (excluding headings — already done in B)
BODY_P_RE  = re.compile(r'(<p(?:\s[^>]*)?>)((?:(?!data-es).){10,}?)(</p>)', re.DOTALL)
BODY_LI_RE = re.compile(r'(<li(?:\s[^>]*)?>)((?:(?!data-es).){10,}?)(</li>)', re.DOTALL)
BODY_BQ_RE = re.compile(r'(<blockquote(?:\s[^>]*)?>)((?:(?!data-es).){10,}?)(</blockquote>)', re.DOTALL)
BODY_TD_RE = re.compile(r'(<td(?:\s[^>]*)?>)((?:(?!data-es).){10,}?)(</td>)', re.DOTALL)

BODY_PATTERNS = [BODY_P_RE, BODY_LI_RE, BODY_BQ_RE, BODY_TD_RE]

MAX_TEXT_LEN = 600  # skip elements longer than this (likely contain HTML tables/code)


def extract_body_texts(html: str) -> list[str]:
    am = ARTICLE_RE.search(html)
    if not am:
        return []
    body = am.group(2)
    texts = []
    seen = set()
    for pat in BODY_PATTERNS:
        for m in pat.finditer(body):
            if 'data-es' in m.group(1):
                continue
            plain = re.sub(r'<[^>]+>', '', m.group(2)).strip()
            if plain and 10 < len(plain) <= MAX_TEXT_LEN and plain not in seen:
                seen.add(plain)
                texts.append(plain)
    return texts


def call_haiku_body(texts: list[str]) -> dict[str, str]:
    if not texts:
        return {}
    client = anthropic.Anthropic(api_key=API_KEY)
    # Chunk to avoid token limits (~80 strings per call)
    result = {}
    for i in range(0, len(texts), 60):
        chunk = texts[i:i+60]
        payload = json.dumps(chunk, ensure_ascii=False, indent=2)
        prompt = textwrap.dedent(f"""
            Translate the following English marketing/blog strings to Latam Spanish (Chilean register).
            Rules:
            - Product/tool/brand names stay in English: CRM, AEO, SEO, AI, ChatGPT, Perplexity,
              Claude, HubSpot, Google, WhatsApp, TikTok, Instagram, Meta, etc.
            - No vosotros. Use tú or usted (formal preferred for B2B).
            - Preserve HTML entities (&amp; &larr; &rarr; etc.) unchanged.
            - Preserve URLs and email addresses unchanged.
            - Preserve numbers, percentages, and dollar amounts unchanged.
            - Return ONLY a JSON object mapping each English string to its Spanish translation.
            - No markdown, no explanations — pure JSON.

            Strings:
            {payload}
        """).strip()
        msg = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=8192,
            messages=[{'role': 'user', 'content': prompt}]
        )
        raw = msg.content[0].text.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        result.update(json.loads(raw))
    return result


def inject_body_translations(html: str, tmap: dict[str, str]) -> str:
    am = ARTICLE_RE.search(html)
    if not am:
        return html
    body = am.group(2)
    new_body = body

    def do_replace(m, tmap):
        open_tag, content, close_tag = m.group(1), m.group(2), m.group(3)
        if 'data-es' in open_tag:
            return m.group(0)
        plain = re.sub(r'<[^>]+>', '', content).strip()
        es = tmap.get(plain)
        if not es:
            return m.group(0)
        en_attr = plain.replace('"', '&quot;')
        es_attr = es.replace('"', '&quot;')
        new_open = re.sub(r'>$', f' data-en="{en_attr}" data-es="{es_attr}">', open_tag)
        return new_open + content + close_tag

    for pat in BODY_PATTERNS:
        new_body = pat.sub(lambda m: do_replace(m, tmap), new_body)

    return html[:am.start(2)] + new_body + html[am.end(2):]


def process_file(html_path: Path) -> tuple[str, int]:
    try:
        text = html_path.read_text(encoding='utf-8')
        if any(s in text for s in SPANISH_INDICATORS):
            return (html_path.name, -1)
        texts = extract_body_texts(text)
        if not texts:
            return (html_path.name, 0)
        tmap = call_haiku_body(texts)
        new_text = inject_body_translations(text, tmap)
        if new_text != text:
            if not DRY_RUN:
                html_path.write_text(new_text, encoding='utf-8')
            return (html_path.name, len([t for t in texts if t in tmap]))
        return (html_path.name, 0)
    except Exception as e:
        return (html_path.name, f'ERROR: {e}')


def commit_batch(paths: list[Path], batch_num):
    rel = [str(p.relative_to(ROOT)) for p in paths]
    subprocess.run(['git', 'add'] + rel, cwd=ROOT, check=True)
    msg = f'i18n(blog-c): full article body translation batch {batch_num} ({len(paths)} posts)'
    subprocess.run(['git', 'commit', '-m', msg,
                    '--author=realtape <entrepoker@gmail.com>'], cwd=ROOT, check=True)


if __name__ == '__main__':
    posts = sorted(p for p in BLOG_DIR.glob('*.html'))
    if DRY_RUN:
        posts = posts[:2]
        print(f'DRY RUN — processing {len(posts)} posts\n')
    print(f'Processing {len(posts)} blog posts (full body)...')
    if not API_KEY:
        print('ERROR: ANTHROPIC_API_KEY not found'); sys.exit(1)

    changed_paths = []
    skipped = errors = done = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(process_file, p): p for p in posts}
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
                if done % 20 == 0:
                    print(f'  {done} posts done...')
            if not DRY_RUN and len(changed_paths) >= 25:
                batch_num = (done // 25)
                commit_batch(changed_paths[:25], batch_num)
                changed_paths = changed_paths[25:]

    if not DRY_RUN and changed_paths:
        commit_batch(changed_paths, 'final')

    print(f'\nDone. Modified: {done}, Skipped (ES): {skipped}, Errors: {errors}')

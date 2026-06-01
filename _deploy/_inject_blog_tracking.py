"""One-shot injector: add GA4 + Sentry to blog/*.html files that are missing one or both.

Idempotent — skips files that already have the respective snippet.
Both snippets land immediately before the closing </head>.

Run: python3 _deploy/_inject_blog_tracking.py
"""
import os, glob

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
GA_ID = 'G-V71R6PD7C0'

GA_SNIPPET = f'''  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{ dataLayer.push(arguments); }}
    gtag('js', new Date());
    gtag('config', '{GA_ID}', {{ anonymize_ip: true }});
  </script>
'''

SENTRY_SNIPPET = '''  <!-- Sentry error tracking -->
  <script>window.NWM_SENTRY_DSN = 'https://69fce09a20f1958bd2f1b9e601ba9a46@o4511302572441600.ingest.us.sentry.io/4511302588235776'; window.NWM_RELEASE = 'nwm@1.0.0';</script>
  <script src="/js/nwm-sentry.js" defer></script>
'''

targets = sorted(glob.glob(os.path.join(ROOT, 'blog', '*.html')))

ga_added, sentry_added, skipped_no_head, skipped_already = 0, 0, 0, 0
patched_files = []

for path in targets:
    rel = os.path.relpath(path, ROOT)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            src = f.read()
    except Exception as e:
        print(f'READ_ERR {rel}: {e}')
        continue

    if '</head>' not in src:
        skipped_no_head += 1
        continue

    new_src = src
    file_changed = False

    needs_ga = 'googletagmanager.com/gtag' not in new_src and "gtag('config'" not in new_src
    needs_sentry = 'nwm-sentry.js' not in new_src and 'NWM_SENTRY_DSN' not in new_src

    if needs_ga:
        new_src = new_src.replace('</head>', GA_SNIPPET + '</head>', 1)
        ga_added += 1
        file_changed = True

    if needs_sentry:
        new_src = new_src.replace('</head>', SENTRY_SNIPPET + '</head>', 1)
        sentry_added += 1
        file_changed = True

    if file_changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_src)
        patched_files.append(rel)
    else:
        skipped_already += 1

print(f'Targets scanned: {len(targets)}')
print(f'GA4 added: {ga_added}')
print(f'Sentry added: {sentry_added}')
print(f'Files modified: {len(patched_files)}')
print(f'Skipped (already had both): {skipped_already}')
print(f'Skipped (no </head>): {skipped_no_head}')

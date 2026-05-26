"""Replace all <div class="pricing-tiers">...</div> blocks in services.html
with a single CTA pointing to /pricing.html (source of truth)."""
import re, os

PATH = r'C:\Users\Usuario\Desktop\NetWebMedia\services.html'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# Match from `<div class="pricing-tiers">` to the matching `</div>` using div-depth counting.
def replace_blocks(html):
    out = []
    i = 0
    N = len(html)
    open_re = re.compile(r'<div\b[^>]*\bclass="pricing-tiers"[^>]*>')
    replaced = 0
    while i < N:
        m = open_re.search(html, i)
        if not m:
            out.append(html[i:])
            break
        # copy everything up to the match
        out.append(html[i:m.start()])
        # now walk forward counting div depth from 1 (we just opened one)
        j = m.end()
        depth = 1
        tag_re = re.compile(r'<(/?)(div)\b[^>]*>', re.IGNORECASE)
        while depth > 0 and j < N:
            tm = tag_re.search(html, j)
            if not tm: break
            if tm.group(1) == '/':
                depth -= 1
            else:
                depth += 1
            j = tm.end()
        # Replace the whole span (m.start() to j) with a CTA
        cta = (
            '<div class="pricing-tiers-cta" style="margin:24px 0;padding:28px 24px;border-radius:14px;'
            'background:linear-gradient(135deg,rgba(255,103,31,.08),rgba(139,92,246,.08));'
            'border:1px solid rgba(139,92,246,.22);text-align:center;">'
            '<div style="font-size:14px;color:var(--text-secondary);margin-bottom:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;">Pricing</div>'
            '<div style="font-size:17px;color:#dde3ee;margin-bottom:18px;line-height:1.5;">'
            'Three tiers — Starter, Pro, Max / Scale. Setup fee + monthly retainer.'
            '</div>'
            '<a href="/pricing.html" class="btn-primary" style="display:inline-block;padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#FF671F,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;">'
            'See live pricing &amp; start →</a>'
            '</div>'
        )
        out.append(cta)
        i = j
        replaced += 1
    return ''.join(out), replaced

new_src, count = replace_blocks(src)

# Safety check: ensure we actually changed the file
if count == 0:
    print('No pricing-tiers blocks found — nothing to do.')
else:
    with open(PATH, 'w', encoding='utf-8') as f:
        f.write(new_src)
    print(f'Replaced {count} pricing-tiers blocks in services.html')
    print(f'Size: {len(src)} -> {len(new_src)} bytes (delta {len(new_src)-len(src)})')

# Also remove the JS cart logic that referenced data-price buttons (no longer used)
# but only if the only consumers were the blocks we just replaced
if 'btn-add-cart' in new_src:
    print('NOTE: btn-add-cart references still present outside pricing-tiers blocks — leaving JS alone')
else:
    print('All btn-add-cart references removed. Cart code in page may be dead.')

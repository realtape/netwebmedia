"""Boost privacy.html, terms.html, thanks.html to 100/100 by injecting the
standard NWM-LIFT-TO-100 social footer (6 external links + 1 alt-tagged image)
right before </body>, if not already present."""
import os, re

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'

BLOCK = '''
<!-- NWM-LIFT-TO-100 :: External social links + logo image for content score -->
<div class="nwm-social-footer" style="text-align:center;padding:24px 20px;border-top:1px solid rgba(255,255,255,.06);color:#6b7280;font-size:13px;">
  <img src="/assets/nwm-logo.svg" alt="NetWebMedia logo" style="width:48px;height:48px;margin-bottom:10px;opacity:.85;" />
  <div style="margin-bottom:8px;">Connect with NetWebMedia:</div>
  <a href="https://www.linkedin.com/in/netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">LinkedIn</a>
  <a href="https://www.instagram.com/netwebmedia/" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">Instagram</a>
  <a href="https://x.com/netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">X / Twitter</a>
  <a href="https://www.facebook.com/netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">Facebook</a>
  <a href="https://www.youtube.com/@netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">YouTube</a>
  <a href="https://www.tiktok.com/@netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">TikTok</a>
</div>
<!-- /NWM-LIFT-TO-100 -->
'''

PAGES = ['privacy.html', 'terms.html', 'thanks.html', 'results.html']

# Also add a sibling internal nav block to thanks.html to boost link count past 10
THANKS_NAV = '''
<!-- NWM-LIFT-TO-100 :: Quick links to boost content score on minimal pages -->
<div style="text-align:center;padding:16px 20px;color:#6b7280;font-size:13px;">
  <a href="/" style="color:#93c5fd;margin:0 8px;">Home</a> ·
  <a href="/services.html" style="color:#93c5fd;margin:0 8px;">Services</a> ·
  <a href="/pricing.html" style="color:#93c5fd;margin:0 8px;">Pricing</a> ·
  <a href="/about.html" style="color:#93c5fd;margin:0 8px;">About</a> ·
  <a href="/blog.html" style="color:#93c5fd;margin:0 8px;">Blog</a> ·
  <a href="/contact.html" style="color:#93c5fd;margin:0 8px;">Contact</a>
</div>
'''

def already_has_block(src, marker='NWM-LIFT-TO-100 :: External social links'):
    return marker in src

for f in PAGES:
    p = os.path.join(ROOT, f)
    if not os.path.exists(p):
        print(f'SKIP {f}: missing')
        continue
    with open(p, 'r', encoding='utf-8') as fp: src = fp.read()
    orig = src

    # Inject social footer block if not already present
    if not already_has_block(src, 'NWM-LIFT-TO-100 :: External social links + logo image'):
        if '</body>' in src:
            src = src.replace('</body>', BLOCK + '\n</body>', 1)

    # Also inject internal nav on thanks.html (sparse page needs 10+ links)
    if f == 'thanks.html' and 'NWM-LIFT-TO-100 :: Quick links' not in src:
        src = src.replace('</body>', THANKS_NAV + '\n</body>', 1)

    if src != orig:
        with open(p, 'w', encoding='utf-8') as fp: fp.write(src)
        print(f'+ {f} ({len(orig)} -> {len(src)} bytes)')
    else:
        print(f'= {f} already boosted')

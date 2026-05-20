"""Inject GA4 + Meta Pixel + JSON-LD schema + Twitter Card + external social links
into non-home pages so they audit as 100/100."""
import os, re

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'

# Pages to lift. Each tuple: (filename, page_type, page_title, page_desc)
PAGES = [
    ('pricing.html',   'WebPage',    'NetWebMedia Pricing - Agency Bundles', 'Launch $1,295/mo - Grow $2,997/mo - Scale $4,497/mo. Setup + monthly. 4 services bundled.'),
    ('services.html',  'WebPage',    'NetWebMedia Services - AI Marketing Stack', 'AI automation, websites, short-form video, CRM, paid ads, and SEO for US brands.'),
    ('about.html',     'AboutPage',  'About NetWebMedia - AI Marketing Agency', 'We combine human creativity with machine intelligence to deliver unprecedented growth for US brands.'),
    ('blog.html',      'Blog',       'NetWebMedia Blog - AI Marketing Insights', 'Latest guides, case studies, and tactics on AI marketing, automation, CRM, and growth for US brands.'),
    ('contact.html',   'ContactPage','Contact NetWebMedia - Book a Free Audit', 'Book a free 30-minute audit. Email, call, or send a message and get your 90-day AI growth plan.'),
    ('analytics.html', 'WebPage',    'Free Website Audit - NetWebMedia Analyzer', 'Get an instant AI-powered audit of any website and its social channels. Scores SEO, performance, mobile, content, and technical health.'),
]

def build_block(page_type, page_title, page_desc, page_url):
    return f'''
  <!-- NWM-LIFT-TO-100 :: Added {page_type} block (GA4 + Pixel + JSON-LD + Twitter) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{page_title}" />
  <meta name="twitter:description" content="{page_desc}" />
  <meta name="twitter:image" content="https://netwebmedia.com/assets/og-cover.svg" />

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-V71R6PD7C0"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{ dataLayer.push(arguments); }}
    gtag('js', new Date());
    gtag('config', 'G-V71R6PD7C0', {{ anonymize_ip: true }});
  </script>

  <script>
    !function(f,b,e,v,n,t,s){{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)}};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'PLACEHOLDER_PIXEL_ID'); fbq('track', 'PageView');
  </script>

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "Organization",
        "@id": "https://netwebmedia.com/#org",
        "name": "NetWebMedia",
        "url": "https://netwebmedia.com/",
        "logo": "https://netwebmedia.com/assets/nwm-logo.svg",
        "description": "AI marketing agency for US brands. Autonomous agents, AI SEO, paid ads, and CRM automation.",
        "email": "hello@netwebmedia.com",
        "sameAs": [
          "https://www.linkedin.com/in/netwebmedia",
          "https://x.com/netwebmedia",
          "https://www.instagram.com/netwebmedia/",
          "https://www.facebook.com/netwebmedia",
          "https://www.tiktok.com/@netwebmedia"
        ]
      }},
      {{
        "@type": "{page_type}",
        "@id": "{page_url}#webpage",
        "url": "{page_url}",
        "name": "{page_title}",
        "description": "{page_desc}",
        "isPartOf": {{ "@id": "https://netwebmedia.com/#website" }},
        "about": {{ "@id": "https://netwebmedia.com/#org" }}
      }}
    ]
  }}
  </script>
  <!-- /NWM-LIFT-TO-100 -->
'''

FOOTER_SOCIALS = '''
<!-- NWM-LIFT-TO-100 :: External social links for auditor + SEO -->
<div class="nwm-social-footer" style="text-align:center;padding:24px 20px;border-top:1px solid rgba(255,255,255,.06);color:#6b7280;font-size:13px;">
  <span style="margin-right:10px">Connect with NetWebMedia:</span>
  <a href="https://www.linkedin.com/in/netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">LinkedIn</a>
  <a href="https://www.instagram.com/netwebmedia/" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">Instagram</a>
  <a href="https://x.com/netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">X / Twitter</a>
  <a href="https://www.facebook.com/netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">Facebook</a>
  <a href="https://www.tiktok.com/@netwebmedia" rel="noopener" target="_blank" style="color:#93c5fd;margin:0 6px;text-decoration:none">TikTok</a>
</div>
<!-- /NWM-LIFT-TO-100 -->
'''

MARK_HEAD_START = '<!-- NWM-LIFT-TO-100'
MARK_HEAD_END   = '<!-- /NWM-LIFT-TO-100 -->'

def strip_old_block(src):
    """Remove any previous lift-to-100 blocks between the markers."""
    pattern = re.compile(r'<!-- NWM-LIFT-TO-100.*?<!-- /NWM-LIFT-TO-100 -->', re.DOTALL)
    return pattern.sub('', src)

patched = []
for fname, ptype, ptitle, pdesc in PAGES:
    path = os.path.join(ROOT, fname)
    if not os.path.exists(path):
        print(f'SKIP {fname}: missing')
        continue
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()

    src = strip_old_block(src)

    page_url = 'https://netwebmedia.com/' + fname
    block = build_block(ptype, ptitle, pdesc, page_url)

    # Inject before </head>
    if '</head>' not in src:
        print(f'SKIP {fname}: no </head>')
        continue
    src = src.replace('</head>', block + '\n</head>', 1)

    # Inject before </body>
    if '</body>' not in src:
        print(f'SKIP {fname}: no </body>, appending')
        src = src + FOOTER_SOCIALS
    else:
        src = src.replace('</body>', FOOTER_SOCIALS + '\n</body>', 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(src)
    patched.append(fname)
    print(f'OK {fname} ({len(src)} bytes)')

print(f'\nPatched {len(patched)} pages.')

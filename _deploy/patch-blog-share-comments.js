// One-time patch: injects social share + Disqus comments into existing blog HTMLs
// that were generated before these sections existed.
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const BLOG_DIR = 'blog';
const MARKER = '  <p style="text-align:center;margin-top:40px;">';

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let patched = 0;

for (const f of files) {
  const filePath = path.join(BLOG_DIR, f);
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already patched
  if (html.includes('article-share') || html.includes('disqus_thread')) continue;

  // Extract slug and build URLs
  const slug = f.replace(/\.html$/, '');
  const url = `https://netwebmedia.com/blog/${slug}.html`;
  const encodedUrl = encodeURIComponent(url);

  // Extract title from <h1> for share text
  const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
  const encodedTitle = titleMatch ? encodeURIComponent(titleMatch[1]) : encodeURIComponent('NetWebMedia Blog');

  const injection = `  <!-- Social Share -->
  <div class="article-share" style="margin:48px 0 32px;text-align:center;">
    <p style="font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 14px;">Share this article</p>
    <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
      <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#000;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X (Twitter)
      </a>
      <a href="https://linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#0A66C2;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
      <a href="https://facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#1877F2;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </a>
      <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#25D366;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        WhatsApp
      </a>
    </div>
  </div>

  <!-- Comments (Disqus) -->
  <div class="article-comments" style="margin:48px 0;">
    <div id="disqus_thread"></div>
    <script>
      var disqus_config = function () {
        this.page.url = '${url}';
        this.page.identifier = '${slug}';
      };
      (function() {
        var d = document, s = d.createElement('script');
        s.src = 'https://netwebmedia.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
      })();
    </script>
    <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
  </div>

`;

  if (!html.includes(MARKER)) {
    console.warn('SKIP (no marker):', f);
    continue;
  }

  html = html.replace(MARKER, injection + MARKER);
  fs.writeFileSync(filePath, html);
  patched++;
  console.log('+', slug);
}

console.log(`Patched ${patched} files.`);

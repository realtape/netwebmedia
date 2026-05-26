// Patches blog HTMLs that lack social share + comments, OR still have old Disqus embed.
// Run whenever generate-blogs.js template changes and old HTMLs need backfilling.
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const BLOG_DIR = 'blog';
const BACK_MARKER = '  <p style="text-align:center;margin-top:40px;">';

function buildSections(slug) {
  const url = `https://netwebmedia.com/blog/${slug}.html`;
  const encodedUrl = encodeURIComponent(url);

  const html = fs.readFileSync(path.join(BLOG_DIR, slug + '.html'), 'utf8');
  const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
  const encodedTitle = titleMatch ? encodeURIComponent(titleMatch[1]) : encodeURIComponent('NetWebMedia Blog');

  return `  <!-- Social Share -->
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

  <!-- Comments -->
  <div class="article-comments" id="comments" style="margin:48px 0;">
    <h3 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:800;color:#010F3B;margin:0 0 28px;">Comments</h3>

    <!-- Comment list -->
    <div id="nwm-comment-list" style="margin-bottom:36px;"></div>

    <!-- New comment form -->
    <div style="background:#f9fafb;border-radius:12px;padding:28px 32px;border:1px solid #e5e7eb;">
      <p style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;color:#010F3B;margin:0 0 20px;">Leave a comment</p>
      <form id="nwm-comment-form" onsubmit="nwmSubmitComment(event,'${slug}')">
        <input type="text" name="hp_field" style="display:none" tabindex="-1" autocomplete="off" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Name <span style="color:#ef4444">*</span></label>
            <input id="nwm-c-name" type="text" placeholder="Your name" required maxlength="100"
              style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:'Inter',sans-serif;box-sizing:border-box;outline:none;" />
          </div>
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Email <span style="color:#9ca3af;font-weight:400">(optional, never shown)</span></label>
            <input id="nwm-c-email" type="email" placeholder="you@email.com" maxlength="200"
              style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:'Inter',sans-serif;box-sizing:border-box;outline:none;" />
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Comment <span style="color:#ef4444">*</span></label>
          <textarea id="nwm-c-comment" rows="4" placeholder="Share your thoughts..." required maxlength="2000"
            style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:'Inter',sans-serif;resize:vertical;box-sizing:border-box;outline:none;"></textarea>
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
          <button type="submit" id="nwm-c-btn" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:#FF671F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;">Post comment</button>
          <span id="nwm-c-msg" style="font-size:13px;color:#6b7280;"></span>
        </div>
      </form>
    </div>

    <script>
    (function(){
      var API = '/api/comments';
      var slug = '${slug}';

      function timeAgo(iso) {
        var d = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (d < 60) return 'just now';
        if (d < 3600) return Math.floor(d/60) + ' min ago';
        if (d < 86400) return Math.floor(d/3600) + ' hr ago';
        if (d < 2592000) return Math.floor(d/86400) + ' days ago';
        return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
      }

      function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

      function loadComments(){
        fetch(API + '?slug=' + encodeURIComponent(slug))
          .then(function(r){return r.json();})
          .then(function(d){
            var el = document.getElementById('nwm-comment-list');
            if (!el) return;
            if (!d.comments || d.comments.length === 0){
              el.innerHTML = '<p style="color:#9ca3af;font-size:14px;font-style:italic;">No comments yet — be the first!</p>';
              return;
            }
            el.innerHTML = d.comments.map(function(c){
              return '<div style="display:flex;gap:14px;padding:18px 0;border-bottom:1px solid #f3f4f6;">'
                + '<div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:#010F3B;display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;font-size:16px;font-weight:800;color:#FF671F;">'
                + esc(c.name.charAt(0).toUpperCase())
                + '</div>'
                + '<div style="flex:1;min-width:0;">'
                + '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;">'
                + '<strong style="font-size:14px;font-weight:700;color:#111827;font-family:Poppins,sans-serif;">' + esc(c.name) + '</strong>'
                + '<span style="font-size:12px;color:#9ca3af;">' + timeAgo(c.created_at) + '</span>'
                + '</div>'
                + '<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">' + esc(c.comment).replace(/\\n/g,'<br>') + '</p>'
                + '</div></div>';
            }).join('');
          })
          .catch(function(){});
      }

      window.nwmSubmitComment = function(e, slug){
        e.preventDefault();
        var btn = document.getElementById('nwm-c-btn');
        var msg = document.getElementById('nwm-c-msg');
        var hp  = e.target.querySelector('[name="hp_field"]').value;
        var name    = document.getElementById('nwm-c-name').value.trim();
        var email   = document.getElementById('nwm-c-email').value.trim();
        var comment = document.getElementById('nwm-c-comment').value.trim();
        btn.disabled = true;
        btn.textContent = 'Posting…';
        msg.textContent = '';
        fetch(API, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({slug:slug, name:name, email:email, comment:comment, hp_field:hp})
        })
        .then(function(r){return r.json();})
        .then(function(d){
          if (d.ok){
            msg.style.color = '#16a34a';
            msg.textContent = 'Comment posted!';
            document.getElementById('nwm-c-name').value = '';
            document.getElementById('nwm-c-email').value = '';
            document.getElementById('nwm-c-comment').value = '';
            loadComments();
          } else {
            msg.style.color = '#dc2626';
            msg.textContent = d.error || 'Something went wrong. Please try again.';
          }
          btn.disabled = false;
          btn.textContent = 'Post comment';
        })
        .catch(function(){
          msg.style.color = '#dc2626';
          msg.textContent = 'Network error. Please try again.';
          btn.disabled = false;
          btn.textContent = 'Post comment';
        });
      };

      loadComments();
    })();
    </script>
  </div>

`;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let patched = 0;

for (const f of files) {
  const filePath = path.join(BLOG_DIR, f);
  let html = fs.readFileSync(filePath, 'utf8');
  const slug = f.replace(/\.html$/, '');

  // Already has the new custom comment widget — skip
  if (html.includes('nwm-comment-list')) continue;

  const sections = buildSections(slug);

  // Case 1: Has old Disqus block — replace it entirely
  if (html.includes('<!-- Comments (Disqus) -->')) {
    html = html.replace(
      /\s*<!-- Comments \(Disqus\) -->[\s\S]*?<\/div>\s*\n/,
      '\n' + sections
    );
    fs.writeFileSync(filePath, html);
    patched++;
    console.log('~ replaced Disqus:', slug);
    continue;
  }

  // Case 2: Has share bar but no comments — insert before back link
  if (html.includes('article-share') && html.includes(BACK_MARKER)) {
    html = html.replace(BACK_MARKER, sections + BACK_MARKER);
    fs.writeFileSync(filePath, html);
    patched++;
    console.log('+ added comments:', slug);
    continue;
  }

  // Case 3: Neither — inject full block before back link
  if (html.includes(BACK_MARKER)) {
    html = html.replace(BACK_MARKER, sections + BACK_MARKER);
    fs.writeFileSync(filePath, html);
    patched++;
    console.log('+ full inject:', slug);
  } else {
    console.warn('SKIP (no marker):', f);
  }
}

console.log(`\nPatched ${patched} files.`);

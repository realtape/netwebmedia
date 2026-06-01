<?php
/*
 * publish-daily.php — NetWebMedia daily blog automation
 *
 * Cron: runs hourly, self-gates to 9 AM America/New_York.
 * Reads up to 20 drafts from _cron/queue.json, renders each to blog/<slug>.html,
 * rebuilds blog.html, records the run in _cron/last-run.txt.
 *
 * Cron entry:
 *     0 * * * * /usr/bin/php -q /home/webmed6/public_html/_cron/publish-daily.php > /dev/null 2>&1
 *
 * Manual test (skips time gate but still advances the lock):
 *     https://netwebmedia.com/_cron/publish-daily.php?force=1&token=SECRET
 *
 * Dry-run (no files written, prints what would happen):
 *     https://netwebmedia.com/_cron/publish-daily.php?dryrun=1&token=SECRET
 */

date_default_timezone_set('UTC');

$ROOT         = realpath(__DIR__ . '/..');            // public_html
$CRON_DIR     = $ROOT . '/_cron';
$QUEUE_FILE   = $CRON_DIR . '/queue.json';
$PUBLISHED_LOG= $CRON_DIR . '/published.jsonl';
$LAST_RUN     = $CRON_DIR . '/last-run.txt';
$LOG_FILE     = $CRON_DIR . '/cron.log';
$BLOG_DIR     = $ROOT . '/blog';
$BLOG_INDEX   = $ROOT . '/blog.html';
$BATCH_SIZE   = 20;
$SECRET_TOKEN = 'nwm-cron-9a8s7df6g5h4j3k2l1'; // required for ?force / ?dryrun

@mkdir($CRON_DIR, 0755, true);

function lg($msg) { global $LOG_FILE; @file_put_contents($LOG_FILE, '[' . date('c') . '] ' . $msg . "\n", FILE_APPEND); }

$isCli = (php_sapi_name() === 'cli');
$force = (isset($_GET['force']) && $_GET['force'] === '1' && isset($_GET['token']) && $_GET['token'] === $SECRET_TOKEN);
$dryRun = (isset($_GET['dryrun']) && $_GET['dryrun'] === '1' && isset($_GET['token']) && $_GET['token'] === $SECRET_TOKEN);

$ny = new DateTime('now', new DateTimeZone('America/New_York'));
$nyHour = (int)$ny->format('G');
$nyDate = $ny->format('Y-m-d');
$nyHuman = $ny->format('F j, Y');

// --- Gate: only 9 AM NY, unless CLI/cron (always allowed) or ?force ---
if (!$isCli && !$force && !$dryRun && $nyHour !== 9) {
  lg("skip: not 9 AM NY (hour=$nyHour)");
  http_response_code(204);
  exit;
}
// Cron also gates by hour when run from CLI
if ($isCli && $nyHour !== 9 && !$force) {
  lg("skip cli: not 9 AM NY (hour=$nyHour)");
  exit;
}

// --- Gate: don't run twice in one day ---
if (!$force && !$dryRun && file_exists($LAST_RUN) && trim(@file_get_contents($LAST_RUN)) === $nyDate) {
  lg("skip: already ran $nyDate");
  echo "skip:already\n";
  exit;
}

// --- Load queue ---
if (!file_exists($QUEUE_FILE)) {
  lg('error: queue.json missing');
  echo "error:queue-missing\n";
  exit;
}
$queue = json_decode(file_get_contents($QUEUE_FILE), true);
if (!is_array($queue) || count($queue) === 0) {
  lg('skip: queue empty');
  echo "skip:empty\n";
  exit;
}

$batch = array_slice($queue, 0, $BATCH_SIZE);
$remaining = array_slice($queue, $BATCH_SIZE);

$published = [];
foreach ($batch as $post) {
  if (empty($post['slug'])) continue;
  $post['published'] = $nyDate;
  $post['dateLabel'] = $nyHuman;
  $html = renderPostHtml($post);
  $out = $BLOG_DIR . '/' . $post['slug'] . '.html';
  if (!$dryRun) {
    file_put_contents($out, $html);
    @file_put_contents($PUBLISHED_LOG, json_encode(['slug' => $post['slug'], 'published' => $nyDate, 'ts' => date('c')]) . "\n", FILE_APPEND);
  }
  $published[] = $post['slug'];
}

if (!$dryRun) {
  file_put_contents($QUEUE_FILE, json_encode($remaining, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
  rebuildBlogIndex($BLOG_DIR, $BLOG_INDEX);
  file_put_contents($LAST_RUN, $nyDate);
}

lg(($dryRun ? '[dryrun] ' : '') . 'published ' . count($published) . ' queue_remaining=' . count($remaining) . ' slugs=' . implode(',', $published));
echo "OK date=$nyDate published=" . count($published) . " remaining=" . count($remaining) . ($dryRun ? " (DRYRUN)" : "") . "\n";

// ============================================================================
// Helpers
// ============================================================================

function esc($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function hashSlug($s) {
  $h = 0;
  $len = strlen($s);
  for ($i = 0; $i < $len; $i++) {
    $h = (($h * 31) + ord($s[$i])) & 0x7fffffff;
  }
  return $h;
}

function imageFor($slug, $topic) {
  static $pool = null;
  if ($pool === null) {
    $pool = [
      'ai'         => ['1677442136019-21780ecad995','1526374965328-7f61d4dc18c5','1535378917042-10a22c95931a','1620712943543-bcc4688e7485','1655720828018-edd2daec9349','1485827404703-89b55fcc595e','1563089145-599997674d42'],
      'code'       => ['1517694712202-14dd9538aa97','1555066931-4365d14bab8c','1515879218367-8466d910aaa4','1542831371-29b0f74f9713'],
      'data'       => ['1551288049-bebda4e38f71','1460925895917-afdab827c52f','1543286386-713bdd548da4','1543286386-2e659306cd6c'],
      'seo'        => ['1432888498266-38ffec3eaf0a','1533750349088-cd871a92f312','1432821596592-e2c18b78144f'],
      'video'      => ['1522869635100-9f4c5e86aa37','1598899134739-24c46f58b8c0'],
      'voice'      => ['1590602847861-f357a9332bbc','1598488035139-bdbb2231ce04'],
      'paid'       => ['1460925895917-afdab827c52f','1518186285589-2f7649de83e0'],
      'regulation' => ['1589829545856-d10d557cf95f','1505664194779-8beaceb93744'],
      'mobile'     => ['1512941937669-90a1b58e7e9c','1511707171634-5f897ff02aa9'],
      'chips'      => ['1591799264318-7e6ef8ddb7ea','1518770660439-4636190af475'],
      'creative'   => ['1572044162444-ad60f128bdea','1558655146-9f40138edfeb'],
      'meta'       => ['1611162617474-5b21e879e113','1563986768609-322da13575f3'],
      'sales'      => ['1556761175-5973dc0f32e7','1552664730-d307ca884978'],
    ];
  }
  $arr = isset($pool[$topic]) ? $pool[$topic] : $pool['ai'];
  $id = $arr[hashSlug($slug) % count($arr)];
  return 'https://images.unsplash.com/photo-' . $id . '?w=1200&q=80&auto=format&fit=crop';
}

function renderSections($sections) {
  $out = [];
  foreach ($sections as $s) {
    if (isset($s['h2'])) {
      $line = '<h2>' . esc($s['h2']) . '</h2>';
      if (!empty($s['paragraphs'])) {
        $paras = array_map(function($p){ return '<p>' . $p . '</p>'; }, $s['paragraphs']);
        $line .= "\n\n" . implode("\n\n", $paras);
      }
      $out[] = $line;
    } elseif (isset($s['h3'])) {
      $line = '<h3>' . esc($s['h3']) . '</h3>';
      if (!empty($s['paragraphs'])) {
        $paras = array_map(function($p){ return '<p>' . $p . '</p>'; }, $s['paragraphs']);
        $line .= "\n\n" . implode("\n\n", $paras);
      }
      $out[] = $line;
    } elseif (isset($s['list'])) {
      $items = array_map(function($li){ return '  <li>' . $li . '</li>'; }, $s['list']);
      $out[] = "<ul>\n" . implode("\n", $items) . "\n</ul>";
    } elseif (isset($s['olist'])) {
      $items = array_map(function($li){ return '  <li>' . $li . '</li>'; }, $s['olist']);
      $out[] = "<ol>\n" . implode("\n", $items) . "\n</ol>";
    } elseif (isset($s['quote'])) {
      $out[] = '<blockquote>' . esc($s['quote']) . '</blockquote>';
    } elseif (isset($s['p'])) {
      $out[] = '<p>' . $s['p'] . '</p>';
    }
  }
  return implode("\n\n", $out);
}

function renderPostHtml($post) {
  $slug       = $post['slug'];
  $topic      = isset($post['topic']) ? $post['topic'] : 'ai';
  $img        = imageFor($slug, $topic);
  $url        = 'https://netwebmedia.com/blog/' . $slug . '.html';
  $pubISO     = $post['published'];
  $bodyHtml   = renderSections($post['sections']);
  $title      = esc($post['title']);
  $desc       = esc($post['description']);
  $author     = esc($post['author']);
  $tag        = esc($post['tag']);
  $dateLabel  = esc(isset($post['dateLabel']) ? $post['dateLabel'] : $pubISO);
  $readTime   = esc(isset($post['readTime']) ? $post['readTime'] : '6 min read');
  $titleJson  = json_encode($post['title'],       JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $descJson   = json_encode($post['description'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $authorJson = json_encode($post['author'],      JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

  $html  = "<!DOCTYPE html>\n";
  $html .= "<html lang=\"en\">\n";
  $html .= "<head>\n";
  $html .= "  <meta charset=\"UTF-8\" />\n";
  $html .= "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n";
  $html .= "  <title>{$title} — NetWebMedia Blog</title>\n";
  $html .= "  <meta name=\"description\" content=\"{$desc}\" />\n";
  $html .= "  <link rel=\"canonical\" href=\"{$url}\" />\n";
  $html .= "  <meta name=\"robots\" content=\"index, follow, max-image-preview:large\" />\n";
  $html .= "  <meta property=\"og:title\" content=\"{$title}\" />\n";
  $html .= "  <meta property=\"og:description\" content=\"{$desc}\" />\n";
  $html .= "  <meta property=\"og:type\" content=\"article\" />\n";
  $html .= "  <meta property=\"og:url\" content=\"{$url}\" />\n";
  $html .= "  <meta property=\"og:image\" content=\"{$img}\" />\n";
  $html .= "  <meta property=\"og:image:width\" content=\"1200\" />\n";
  $html .= "  <meta property=\"og:image:height\" content=\"630\" />\n";
  $html .= "  <meta property=\"og:site_name\" content=\"NetWebMedia\" />\n";
  $html .= "  <meta property=\"og:locale\" content=\"en_US\" />\n";
  $html .= "  <meta property=\"article:published_time\" content=\"{$pubISO}\" />\n";
  $html .= "  <meta property=\"article:author\" content=\"{$author}\" />\n";
  $html .= "  <meta name=\"twitter:card\" content=\"summary_large_image\" />\n";
  $html .= "  <meta name=\"twitter:title\" content=\"{$title}\" />\n";
  $html .= "  <meta name=\"twitter:description\" content=\"{$desc}\" />\n";
  $html .= "  <meta name=\"twitter:image\" content=\"{$img}\" />\n";
  $html .= "  <link rel=\"stylesheet\" href=\"../css/styles.css\" />\n";
  $html .= "  <link rel=\"icon\" type=\"image/svg+xml\" href=\"../assets/nwm-logo.svg\" />\n";
  $html .= "  <link rel=\"apple-touch-icon\" href=\"../assets/nwm-logo.svg\" />\n";
  $html .= "  <script type=\"application/ld+json\">\n";
  $html .= "{\n";
  $html .= "  \"@context\": \"https://schema.org\",\n";
  $html .= "  \"@type\": \"BlogPosting\",\n";
  $html .= "  \"headline\": {$titleJson},\n";
  $html .= "  \"description\": {$descJson},\n";
  $html .= "  \"author\": { \"@type\": \"Person\", \"name\": {$authorJson} },\n";
  $html .= "  \"publisher\": { \"@type\": \"Organization\", \"name\": \"NetWebMedia\", \"logo\": { \"@type\": \"ImageObject\", \"url\": \"https://netwebmedia.com/assets/nwm-logo.svg\" } },\n";
  $html .= "  \"datePublished\": \"{$pubISO}\",\n";
  $html .= "  \"image\": \"{$img}\",\n";
  $html .= "  \"mainEntityOfPage\": \"{$url}\",\n";
  $html .= "  \"inLanguage\": \"en-US\"\n";
  $html .= "}\n";
  $html .= "  </script>\n";
  $html .= "</head>\n";
  $html .= "<body>\n";
  $html .= "<a class=\"skip-link\" href=\"#main\">Skip to main content</a>\n\n";
  $html .= "<div class=\"lang-bar\"><div class=\"container\">\n";
  $html .= "  <button class=\"lang-btn active\" data-lang=\"en\"><img class=\"flag\" src=\"https://flagcdn.com/w40/us.png\" alt=\"EN\" loading=\"lazy\" width=\"20\" height=\"15\" /> English</button>\n";
  $html .= "  <button class=\"lang-btn\" data-lang=\"es\"><img class=\"flag\" src=\"https://flagcdn.com/w40/es.png\" alt=\"ES\" loading=\"lazy\" width=\"20\" height=\"15\" /> Español</button>\n";
  $html .= "    <a href=\"/app/\" class=\"lang-client-login\" data-i18n=\"nav_dashboard\">🔐 Client Login</a>\n";
  $html .= "</div></div>\n\n";
  $html .= "<nav class=\"navbar has-lang-bar\" id=\"navbar\"><div class=\"container\"><div class=\"navbar-inner\">\n";
  $html .= "  <a href=\"../index.html\" class=\"nav-logo\"><img src=\"../assets/nwm-logo-horizontal.svg\" alt=\"NetWebMedia\" class=\"logo-lockup\" style=\"height:52px\"></a>\n";
  $html .= "  <div class=\"nav-links\">\n";
  $html .= "    <a href=\"../services.html\">Services</a>\n";
  $html .= "    <a href=\"../about.html\">About</a>\n";
  $html .= "    <a href=\"../results.html\">Results</a>\n";
  $html .= "    <a href=\"../blog.html\" class=\"active\">Blog</a>\n";
  $html .= "    <a href=\"../contact.html\">Contact</a>\n";
  $html .= "  </div>\n";
  $html .= "  <div class=\"nav-ctas\">\n";
  $html .= "    <a href=\"../cart.html\" class=\"nav-cart\" aria-label=\"View cart\">🛒<span class=\"nav-cart-count\" aria-hidden=\"true\">0</span></a>\n";
  $html .= "    <a href=\"../dashboard.html\" class=\"btn-nav-outline\">Dashboard</a>\n";
  $html .= "    <a href=\"../contact.html\" class=\"btn-nav-solid\">Get a Free Audit</a>\n";
  $html .= "  </div>\n";
  $html .= "  <button class=\"hamburger\" id=\"hamburger\"><span></span><span></span><span></span></button>\n";
  $html .= "</div></div></nav>\n\n";
  $html .= "<main id=\"main\">\n";
  $html .= "<div class=\"mobile-menu\" id=\"mobile-menu\">\n";
  $html .= "  <a href=\"../services.html\">Services</a>\n";
  $html .= "  <a href=\"../about.html\">About</a>\n";
  $html .= "  <a href=\"../results.html\">Results</a>\n";
  $html .= "  <a href=\"../blog.html\">Blog</a>\n";
  $html .= "  <a href=\"../contact.html\">Contact</a>\n";
  $html .= "  <a href=\"../contact.html\" class=\"btn-primary\">Get a Free Audit</a>\n";
  $html .= "</div>\n\n";
  $html .= "<section class=\"article-hero\">\n";
  $html .= "  <div class=\"container\">\n";
  $html .= "    <a class=\"article-back\" href=\"../blog.html\">← All articles</a>\n";
  $html .= "    <div class=\"tag\">{$tag}</div>\n";
  $html .= "    <h1>{$title}</h1>\n";
  $html .= "    <div class=\"article-meta\">By {$author} · {$dateLabel} · {$readTime}</div>\n";
  $html .= "    <div class=\"article-cover\" style=\"background-image:url('{$img}');background-size:cover;background-position:center;\" role=\"img\" aria-label=\"Article cover\"></div>\n";
  $html .= "  </div>\n";
  $html .= "</section>\n\n";
  $html .= "<article class=\"article-body\">\n";
  $html .= $bodyHtml . "\n\n";
  $html .= "  <div class=\"article-cta-box\">\n";
  $html .= "    <h3>Want this working inside your own stack?</h3>\n";
  $html .= "    <p>NetWebMedia builds AI marketing systems for US brands — from autonomous agents to full AEO-ready content engines. Book a free 30-minute strategy call and we'll map out the highest-ROI next step for your team.</p>\n";
  $html .= "    <a class=\"btn-primary\" href=\"../contact.html\">Book a Free Strategy Call →</a>\n";
  $html .= "  </div>\n\n";
  $html .= "  <p style=\"text-align:center;margin-top:40px;\">\n";
  $html .= "    <a class=\"article-back\" href=\"../blog.html\">← Back to all articles</a>\n";
  $html .= "  </p>\n";
  $html .= "</article>\n";
  $html .= "</main>\n\n";
  $html .= "<footer>\n";
  $html .= "  <div class=\"container\">\n";
  $html .= "    <div class=\"footer-grid\">\n";
  $html .= "      <div class=\"footer-brand\">\n";
  $html .= "        <a href=\"../index.html\" class=\"nav-logo\"><img src=\"../assets/nwm-logo-horizontal.svg\" alt=\"NetWebMedia\" class=\"logo-lockup\" style=\"height:52px\" loading=\"lazy\" width=\"200\" height=\"52\"></a>\n";
  $html .= "        <p>The world's most advanced AI marketing agency.</p>\n";
  $html .= "      </div>\n";
  $html .= "      <div class=\"footer-col\"><h4>Services</h4><ul>\n";
  $html .= "        <li><a href=\"../services.html#ai-automations\">AI Automations</a></li>\n";
  $html .= "        <li><a href=\"../services.html#ai-agents\">AI Agents</a></li>\n";
  $html .= "        <li><a href=\"../services.html#ai-seo\">AI SEO</a></li>\n";
  $html .= "        <li><a href=\"../services.html#paid-ads\">Paid Ads</a></li>\n";
  $html .= "      </ul></div>\n";
  $html .= "      <div class=\"footer-col\"><h4>Company</h4><ul>\n";
  $html .= "        <li><a href=\"../about.html\">About</a></li>\n";
  $html .= "        <li><a href=\"../results.html\">Results</a></li>\n";
  $html .= "        <li><a href=\"../blog.html\">Blog</a></li>\n";
  $html .= "        <li><a href=\"../contact.html\">Contact</a></li>\n";
  $html .= "      </ul></div>\n";
  $html .= "      <div class=\"footer-col\"><h4>Connect</h4><ul>\n";
  $html .= "        <li><a href=\"mailto:hello@netwebmedia.com\">hello@netwebmedia.com</a></li>\n";
  $html .= "        <li><a href=\"mailto:hello@netwebmedia.com" target=\"_blank\" rel=\"noopener\">WhatsApp</a></li>\n";
  $html .= "      </ul></div>\n";
  $html .= "    </div>\n";
  $html .= "    <div class=\"footer-bottom\">\n";
  $html .= "      <p>© 2026 NetWebMedia. All rights reserved.</p>\n";
  $html .= "    </div>\n";
  $html .= "  </div>\n";
  $html .= "</footer>\n";
  $html .= "<script src=\"../js/main.js\" defer></script>\n";
  $html .= "<script src=\"../js/cart.js\" defer></script>\n";
  $html .= "</body>\n";
  $html .= "</html>\n";
  return $html;
}

function rebuildBlogIndex($blogDir, $blogIndex) {
  if (!is_dir($blogDir) || !file_exists($blogIndex)) return;
  $files = glob($blogDir . '/*.html');
  $cards = [];
  foreach ($files as $f) {
    $html = file_get_contents($f);
    $slug = basename($f, '.html');
    $meta = [
      'slug'      => $slug,
      'title'     => preg_match('/<h1>([^<]+)<\/h1>/', $html, $m) ? $m[1] : $slug,
      'desc'      => preg_match('/<meta name="description" content="([^"]+)"/', $html, $m) ? $m[1] : '',
      'tag'       => preg_match('/<div class="tag">([^<]+)<\/div>/', $html, $m) ? $m[1] : '',
      'author'    => preg_match('/By\s+([^·<]+?)\s*·/', $html, $m) ? trim($m[1]) : '',
      'readTime'  => preg_match('/·\s*([0-9]+\s*min read)/', $html, $m) ? $m[1] : '6 min read',
      'cover'     => preg_match('/background-image:url\(\'([^\']+)\'\)/', $html, $m) ? $m[1] : '',
      'published' => preg_match('/article:published_time" content="([^"]+)"/', $html, $m) ? $m[1] : '',
    ];
    $cards[] = $meta;
  }
  usort($cards, function($a, $b) { return strcmp($b['published'], $a['published']); });

  $cardsHtml = '';
  foreach ($cards as $c) {
    $cardsHtml .= '      <div class="glass-card blog-card scroll-reveal">' . "\n";
    $cardsHtml .= '        <div class="blog-card-img" style="background-image:url(\'' . $c['cover'] . '\');background-size:cover;background-position:center;" role="img" aria-label="Cover image"></div>' . "\n";
    $cardsHtml .= '        <div class="blog-card-body">' . "\n";
    $cardsHtml .= '          <div class="blog-tag">' . esc($c['tag']) . '</div>' . "\n";
    $cardsHtml .= '          <h3 class="blog-title"><a href="blog/' . $c['slug'] . '.html">' . esc($c['title']) . '</a></h3>' . "\n";
    $cardsHtml .= '          <p class="blog-excerpt">' . esc($c['desc']) . '</p>' . "\n";
    $cardsHtml .= '          <div class="blog-meta">' . esc($c['author']) . ' · ' . esc($c['readTime']) . '</div>' . "\n";
    $cardsHtml .= '        </div>' . "\n";
    $cardsHtml .= '      </div>' . "\n";
  }

  $blogHtml = file_get_contents($blogIndex);
  $blogHtml = preg_replace(
    '/(<div class="blog-grid">)[\s\S]*?(\n\s*<\/div>\s*\n\s*<!-- Newsletter CTA -->)/',
    '$1' . "\n" . $cardsHtml . '$2',
    $blogHtml
  );
  file_put_contents($blogIndex, $blogHtml);
}

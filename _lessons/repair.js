// Repairs broken lesson JSON files by re-escaping HTML content fields
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'package.json');
let fixed = 0, failed = 0;

for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  try {
    JSON.parse(raw);
    console.log('OK:', f);
    continue;
  } catch(e) {}

  // Strategy: extract the raw text, find content fields and re-escape them
  // The content fields embed HTML with unescaped double quotes
  // Replace unescaped " inside content values with &quot; or escaped \"

  // Approach: use a regex to find "content": "..." spans and escape their internals
  // Since the HTML may have complex nesting, we'll do a character-level scan
  let result = '';
  let i = 0;
  let repaired = false;

  // Find all "content": " occurrences and escape their string body
  const marker = '"content": "';
  const alt = '"content":"';

  function repairString(src) {
    // Scan character by character through the JSON, fixing string values
    let out = '';
    let j = 0;
    while (j < src.length) {
      // Look for a JSON string starting with a key we want to repair
      // Actually, let's try a simpler approach: replace unescaped quotes in HTML
      // Find pattern: "content": "...{unescaped "s}..."
      // We'll use a state machine
      out += src[j];
      j++;
    }
    return out;
  }

  // Better approach: find each "content" key, then manually scan to find its string boundary
  let text = raw;
  let searchFrom = 0;
  let anyFix = false;

  while (true) {
    let ci = text.indexOf('"content":', searchFrom);
    if (ci === -1) break;

    // Find the start of the string value after ": "
    let si = ci + 10; // after '"content":'
    while (si < text.length && (text[si] === ' ' || text[si] === '\t' || text[si] === '\n' || text[si] === '\r')) si++;
    if (text[si] !== '"') { searchFrom = si; continue; }
    si++; // skip opening quote

    // Now scan for the end of the string, tracking escapes
    let contentStart = si;
    let ei = si;
    let depth = 0;
    while (ei < text.length) {
      if (text[ei] === '\\') { ei += 2; continue; } // escaped char, skip
      if (text[ei] === '"') break; // unescaped quote = end of string... or is it?
      ei++;
    }

    // Extract the content between the quotes
    let contentRaw = text.slice(contentStart, ei);

    // Check if this content is valid (no bare unescaped quotes that would break JSON)
    // Try to parse the whole thing; if it fails, the content has bad quotes
    // Re-escape any unescaped double quotes within the content
    // Since this is HTML, we need to escape " that aren't already escaped
    let fixed_content = contentRaw.replace(/\\"/g, '\x00ESCAPED\x00').replace(/"/g, '\\"').replace(/\x00ESCAPED\x00/g, '\\"');

    if (fixed_content !== contentRaw) {
      anyFix = true;
      text = text.slice(0, contentStart) + fixed_content + text.slice(ei);
      searchFrom = contentStart + fixed_content.length + 1; // +1 for closing quote
    } else {
      searchFrom = ei + 1;
    }
  }

  // Try parsing now
  try {
    JSON.parse(text);
    fs.writeFileSync(path.join(dir, f), text, 'utf8');
    console.log('FIXED:', f, anyFix ? '(escaped quotes)' : '(rewritten)');
    fixed++;
  } catch(e2) {
    // Last resort: try to extract lessons array manually using a more aggressive approach
    console.log('STILL BROKEN:', f, e2.message.substring(0,80));

    // Try replacing all " inside HTML tag attributes with &quot;
    let aggressive = raw;
    // Replace attribute quotes: =" ... " patterns
    aggressive = aggressive.replace(/=\\?"([^"\\]*(?:\\.[^"\\]*)*)\\?"/g, (m, inner) => {
      return '=&quot;' + inner + '&quot;';
    });
    try {
      JSON.parse(aggressive);
      fs.writeFileSync(path.join(dir, f), aggressive, 'utf8');
      console.log('  -> FIXED with aggressive method:', f);
      fixed++;
    } catch(e3) {
      console.log('  -> COULD NOT FIX:', f);
      failed++;
    }
  }
}

console.log(`\nDone: ${fixed} fixed, ${failed} failed`);

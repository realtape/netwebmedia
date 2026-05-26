// Fixes lesson JSON files where HTML content has unescaped double quotes
const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Usuario/Desktop/NetWebMedia/_lessons';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

function fixFile(filename) {
  const raw = fs.readFileSync(path.join(dir, filename), 'utf8');
  try { JSON.parse(raw); return 'ok'; } catch(e) {}

  // Scan character by character through the JSON string
  // When inside a JSON string value, escape any bare " that would break the parse
  let out = '';
  let i = 0;

  function skipWhitespace() {
    while (i < raw.length && ' \t\n\r'.includes(raw[i])) i++;
  }

  // Parse a JSON string starting at the current " character
  // Returns the properly escaped string including surrounding quotes
  function readAndFixString() {
    let s = '"';
    i++; // skip opening "
    while (i < raw.length) {
      const ch = raw[i];
      if (ch === '\\') {
        // Escape sequence - keep as-is
        s += ch + raw[i+1];
        i += 2;
      } else if (ch === '"') {
        // Might be end of string or a bad unescaped quote inside
        // Peek ahead: if what follows looks like '}' or ',' or whitespace then key/end, it's the real end
        // Otherwise it's a stray quote in HTML that needs escaping
        // We need to decide: is this the closing quote?
        // Look at context after this quote
        let j = i + 1;
        while (j < raw.length && ' \t\n\r'.includes(raw[j])) j++;
        const next = raw[j];
        // Closing quote is followed by: , } ] or a key pattern like ","
        // A bad internal quote is usually followed by a letter, digit, =, >, <, space, etc.
        if (next === ',' || next === '}' || next === ']' || next === ':') {
          // This is the real closing quote
          s += '"';
          i++;
          break;
        } else {
          // This is an unescaped quote inside the string - escape it
          s += '\\"';
          i++;
        }
      } else {
        s += ch;
        i++;
      }
    }
    return s;
  }

  // Walk through the entire file token by token
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '"') {
      out += readAndFixString();
    } else {
      out += ch;
      i++;
    }
  }

  try {
    JSON.parse(out);
    fs.writeFileSync(path.join(dir, filename), out, 'utf8');
    return 'fixed';
  } catch(e2) {
    return 'failed: ' + e2.message.substring(0, 60);
  }
}

let ok = 0, fixed = 0, failed = 0;
for (const f of files) {
  if (!f.endsWith('.json')) continue;
  const result = fixFile(f);
  if (result === 'ok') { ok++; }
  else if (result === 'fixed') { console.log('FIXED:', f); fixed++; }
  else { console.log('FAIL:', f, result); failed++; }
}
console.log(`\n${ok} already valid, ${fixed} fixed, ${failed} failed`);

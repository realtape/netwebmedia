const fs = require('fs');
const s = fs.readFileSync('C:/Users/Usuario/Downloads/Home.bundle.html', 'utf8');
const marker = 'class=\\"headline\\"';
const i = s.indexOf(marker);
const hStart = s.lastIndexOf('<h1 ', i);
const pEnd = s.indexOf('<\\u002Fp>', i);
const raw = s.slice(hStart, pEnd + '<\\u002Fp>'.length);
console.log(JSON.stringify(raw));

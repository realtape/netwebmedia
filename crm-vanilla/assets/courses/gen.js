// Generates SVG infographic covers for all 15 NWM courses
const fs = require('fs');
const path = require('path');

const courses = [
  { slug:'nwm-crm',              color:'#6c5ce7', icon:'📇', shapes:'crm' },
  { slug:'nwm-cms',              color:'#00cec9', icon:'🌐', shapes:'grid' },
  { slug:'ai-automate',          color:'#a29bfe', icon:'⚡', shapes:'neural' },
  { slug:'ai-chat-agents',       color:'#22d3ee', icon:'🤖', shapes:'chat' },
  { slug:'ai-seo',               color:'#00b894', icon:'🔍', shapes:'bars' },
  { slug:'email-marketing',      color:'#e17055', icon:'💌', shapes:'flow' },
  { slug:'paid-ads',             color:'#fd79a8', icon:'🎯', shapes:'target' },
  { slug:'social-media',         color:'#fdcb6e', icon:'📱', shapes:'social' },
  { slug:'video-factory',        color:'#8b5cf6', icon:'🎬', shapes:'wave' },
  { slug:'websites',             color:'#0984e3', icon:'🖥️', shapes:'grid' },
  { slug:'fractional-cmo',       color:'#d63031', icon:'🧠', shapes:'neural' },
  { slug:'analyzer',             color:'#74b9ff', icon:'📊', shapes:'bars' },
  { slug:'whatsapp-automation',  color:'#25d366', icon:'💬', shapes:'chat' },
  { slug:'chatbot-automation',   color:'#22d3ee', icon:'🤖', shapes:'flow' },
  { slug:'sms-automation',       color:'#a29bfe', icon:'📲', shapes:'target' },
  // New service-mapped courses
  { slug:'ai-sdr',               color:'#e74c3c', icon:'📞', shapes:'flow' },
  { slug:'ai-voice',             color:'#27ae60', icon:'🎙️', shapes:'wave' },
  { slug:'creative-studio',      color:'#e67e22', icon:'🎨', shapes:'wave' },
  { slug:'rag-knowledge',        color:'#8e44ad', icon:'🧩', shapes:'neural' },
  { slug:'cro',                  color:'#00cec9', icon:'📈', shapes:'bars' },
  { slug:'headless-commerce',    color:'#2980b9', icon:'🛒', shapes:'grid' },
  { slug:'ai-copilot',           color:'#9b59b6', icon:'🪄', shapes:'neural' },
  { slug:'content-ai',           color:'#e91e8c', icon:'✍️', shapes:'flow' },
  { slug:'lead-scoring',         color:'#f39c12', icon:'🎯', shapes:'target' },
  { slug:'sales-forecasting',    color:'#1abc9c', icon:'📊', shapes:'bars' },
  { slug:'customer-portal',      color:'#3498db', icon:'🏛️', shapes:'grid' },
  { slug:'reputation-monitoring',color:'#c0392b', icon:'⭐', shapes:'social' },
  { slug:'affiliate-program',    color:'#2ecc71', icon:'🤝', shapes:'social' },
  { slug:'ai-training',          color:'#7f8c8d', icon:'🎓', shapes:'neural' },
];

function hex2rgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function shapesBars(c) {
  const bars = [60,90,45,75,55,85,40,70].map((h,i) =>
    `<rect x="${160+i*52}" y="${340-h}" width="36" height="${h}" rx="4" fill="${c}" fill-opacity="${0.3+i*0.07}"/>`
  ).join('');
  return bars + `<polyline points="160,300 212,270 264,310 316,240 368,280 420,220 472,260 524,200" fill="none" stroke="${c}" stroke-width="3" stroke-opacity="0.6"/>`;
}

function shapesNeural(c) {
  const nodes = [[200,150],[400,100],[600,160],[300,280],[500,260],[200,350],[650,320]];
  const edges = [[0,1],[1,2],[0,3],[1,3],[1,4],[2,4],[3,5],[4,6]];
  const lines = edges.map(([a,b]) =>
    `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${c}" stroke-width="2" stroke-opacity="0.3"/>`
  ).join('');
  const circles = nodes.map(([x,y],i) =>
    `<circle cx="${x}" cy="${y}" r="${i===1?18:12}" fill="${c}" fill-opacity="${i===1?0.6:0.35}"/>`
  ).join('');
  return lines + circles;
}

function shapesGrid(c) {
  let s = '';
  for(let col=0;col<4;col++) for(let row=0;row<3;row++) {
    const x = 160+col*140, y = 100+row*110;
    s += `<rect x="${x}" y="${y}" width="110" height="80" rx="8" fill="${c}" fill-opacity="${0.12+Math.random()*0.1}" stroke="${c}" stroke-width="1" stroke-opacity="0.25"/>`;
    s += `<rect x="${x+10}" y="${y+10}" width="${40+Math.random()*40}" height="6" rx="3" fill="${c}" fill-opacity="0.4"/>`;
    s += `<rect x="${x+10}" y="${y+26}" width="${20+Math.random()*60}" height="4" rx="2" fill="${c}" fill-opacity="0.2"/>`;
  }
  return s;
}

function shapesChat(c) {
  const bubbles = [
    [200,120,260,50,'left'],
    [320,200,280,50,'right'],
    [200,280,300,50,'left'],
    [380,350,240,50,'right'],
  ];
  return bubbles.map(([x,y,w,h,side]) => {
    const bx = side==='right' ? 800-x-w : x;
    return `<rect x="${bx}" y="${y}" width="${w}" height="${h}" rx="24" fill="${c}" fill-opacity="${side==='right'?0.35:0.15}" stroke="${c}" stroke-width="1.5" stroke-opacity="0.4"/>` +
           `<rect x="${bx+16}" y="${y+18}" width="${w*0.6}" height="6" rx="3" fill="${c}" fill-opacity="0.5"/>`;
  }).join('');
}

function shapesFlow(c) {
  const nodes = [[160,180],[380,180],[600,180],[160,320],[380,320],[600,320]];
  const pairs = [[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]];
  return pairs.map(([a,b]) =>
    `<line x1="${nodes[a][0]+50}" y1="${nodes[a][1]+25}" x2="${nodes[b][0]}" y2="${nodes[b][1]+25}" stroke="${c}" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 4"/>`
  ).join('') + nodes.map(([x,y]) =>
    `<rect x="${x}" y="${y}" width="100" height="50" rx="10" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-width="1.5" stroke-opacity="0.4"/>`
  ).join('');
}

function shapesTarget(c) {
  return [160,120,80,40].map((r,i) =>
    `<circle cx="420" cy="225" r="${r}" fill="none" stroke="${c}" stroke-width="${i===0?3:2}" stroke-opacity="${0.15+i*0.15}"/>`
  ).join('') +
  `<line x1="200" y1="225" x2="640" y2="225" stroke="${c}" stroke-width="1.5" stroke-opacity="0.2"/>
   <line x1="420" y1="60" x2="420" y2="390" stroke="${c}" stroke-width="1.5" stroke-opacity="0.2"/>
   <circle cx="420" cy="225" r="16" fill="${c}" fill-opacity="0.7"/>`;
}

function shapesSocial(c) {
  const icons = [[160,120],[420,80],[660,140],[250,300],[550,280]];
  const links = [[0,1],[1,2],[0,3],[1,4],[2,4]];
  return links.map(([a,b]) =>
    `<line x1="${icons[a][0]}" y1="${icons[a][1]}" x2="${icons[b][0]}" y2="${icons[b][1]}" stroke="${c}" stroke-width="2" stroke-opacity="0.25"/>`
  ).join('') + icons.map(([x,y],i) =>
    `<circle cx="${x}" cy="${y}" r="${i===1?28:20}" fill="${c}" fill-opacity="${i===1?0.45:0.25}" stroke="${c}" stroke-width="1.5" stroke-opacity="0.5"/>`
  ).join('');
}

function shapesWave(c) {
  return `<path d="M0,280 C120,220 240,340 360,270 C480,200 600,340 720,260 L720,450 L0,450Z" fill="${c}" fill-opacity="0.1"/>
          <path d="M0,320 C140,260 280,370 420,300 C560,230 680,360 800,290 L800,450 L0,450Z" fill="${c}" fill-opacity="0.08"/>
          <circle cx="120" cy="180" r="50" fill="${c}" fill-opacity="0.15"/>
          <circle cx="400" cy="140" r="65" fill="${c}" fill-opacity="0.12"/>
          <circle cx="680" cy="170" r="45" fill="${c}" fill-opacity="0.18"/>`;
}

function getShapes(type, c) {
  switch(type) {
    case 'bars':   return shapesBars(c);
    case 'neural': return shapesNeural(c);
    case 'grid':   return shapesGrid(c);
    case 'chat':   return shapesChat(c);
    case 'flow':   return shapesFlow(c);
    case 'target': return shapesTarget(c);
    case 'social': return shapesSocial(c);
    case 'wave':   return shapesWave(c);
    case 'crm':    return shapesBars(c) + shapesNeural(c).slice(0, 200);
    default:       return shapesBars(c);
  }
}

for (const course of courses) {
  const [r,g,b] = hex2rgb(course.color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <radialGradient id="bg${course.slug.replace(/-/g,'')}" cx="75%" cy="25%" r="65%">
      <stop offset="0%" stop-color="${course.color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#010F3B" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade${course.slug.replace(/-/g,'')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="60%" stop-color="#010F3B" stop-opacity="0"/>
      <stop offset="100%" stop-color="#010F3B" stop-opacity="0.9"/>
    </linearGradient>
  </defs>

  <!-- Base -->
  <rect width="800" height="450" fill="#010F3B"/>
  <rect width="800" height="450" fill="url(#bg${course.slug.replace(/-/g,'')})"/>

  <!-- Topic shapes -->
  ${getShapes(course.shapes, course.color)}

  <!-- Bottom fade -->
  <rect width="800" height="450" fill="url(#fade${course.slug.replace(/-/g,'')})"/>

  <!-- Accent bar -->
  <rect x="0" y="430" width="800" height="4" fill="${course.color}" fill-opacity="0.8"/>

  <!-- Dot grid background -->
  ${Array.from({length:12},(_,col)=>Array.from({length:7},(_,row)=>
    `<circle cx="${col*70+35}" cy="${row*65+32}" r="1.5" fill="${course.color}" fill-opacity="0.06"/>`
  ).join('')).join('')}

  <!-- Emoji -->
  <text x="60" y="400" font-size="80" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, serif">${course.icon}</text>

  <!-- Left accent line -->
  <rect x="0" y="0" width="3" height="450" fill="${course.color}" fill-opacity="0.5"/>
</svg>`;

  const outPath = path.join(__dirname, `${course.slug}.svg`);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('✓', course.slug);
}
console.log('Done — 15 SVGs generated.');

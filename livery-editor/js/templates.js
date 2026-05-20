// roundRect polyfill — ctx.roundRect is Chrome 99+ / Firefox 112+
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Math.min(r, Math.min(w, h) / 2);
    this.beginPath();
    this.moveTo(x + rr, y);
    this.lineTo(x + w - rr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + rr);
    this.lineTo(x + w, y + h - rr);
    this.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    this.lineTo(x + rr, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - rr);
    this.lineTo(x, y + rr);
    this.quadraticCurveTo(x, y, x + rr, y);
    this.closePath();
    return this;
  };
}

// Car template definitions — SVG paths on a 1000×420 coordinate grid
// Body paths are clockwise. Wheel wells cut inward from the bottom.

const TEMPLATES = {

  stock: {
    name: 'NASCAR Stock Car',
    w: 1000, h: 420,
    // Main body silhouette
    body: `
      M 75,308
      L 55,255
      L 58,200
      Q 65,168 98,158
      L 170,138
      L 232,110
      Q 258,88 278,82
      L 730,78
      L 762,88
      Q 788,112 800,156
      L 828,150
      L 833,115
      L 858,110
      L 855,152
      L 862,196
      Q 866,248 856,308
      L 770,308
      Q 766,388 688,388
      Q 610,388 606,308
      L 328,308
      Q 324,388 246,388
      Q 168,388 164,308
      Z
    `,
    // Glass/windows
    glass: `
      M 283,94
      L 277,146
      L 746,141
      L 762,94
      Z
    `,
    // Decorative detail lines (headlights, grille, spoiler detail)
    details: `
      M 58,200 Q 62,175 72,168
      M 56,255 L 62,240
      M 855,152 L 858,110 L 870,108 L 866,152
      M 835,148 L 835,305
    `,
    wheels: [
      { cx: 247, cy: 388, r: 72 },
      { cx: 689, cy: 388, r: 72 }
    ],
    // Colored section regions for orientation
    sections: [
      {
        id: 'hood',
        label: 'Hood',
        x: 145, y: 165,
        path: `M 164,308 L 164,162 L 232,110 Q 258,88 278,82 L 283,94 L 277,146 L 277,308 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'left-door',
        label: 'Door Panel',
        x: 385, y: 200,
        path: `M 277,146 L 277,308 L 606,308 L 606,141 Z`,
        fill: 'rgba(100,140,255,0.10)'
      },
      {
        id: 'rear-quarter',
        label: 'Rear Quarter',
        x: 720, y: 200,
        path: `M 606,141 L 606,308 L 770,308 L 800,156 L 762,88 L 746,141 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'roof',
        label: 'Roof',
        x: 500, y: 60,
        path: `M 283,94 L 277,146 L 606,141 L 746,141 L 762,88 L 730,78 L 278,82 Z`,
        fill: 'rgba(80,200,120,0.10)'
      }
    ]
  },

  gt3: {
    name: 'GT3 Sports Car',
    w: 1000, h: 420,
    body: `
      M 72,298
      L 48,252
      L 52,210
      Q 60,178 85,165
      L 145,148
      L 195,118
      L 235,92
      Q 255,78 275,75
      L 740,72
      L 775,82
      Q 808,98 825,148
      L 850,142
      L 858,108
      L 882,112
      L 878,148
      L 885,185
      Q 890,242 878,298
      L 795,298
      Q 790,378 715,378
      Q 640,378 635,298
      L 315,298
      Q 310,378 235,378
      Q 160,378 155,298
      Z
    `,
    glass: `
      M 280,85
      L 272,138
      L 755,132
      L 772,85
      Z
    `,
    details: `
      M 48,252 L 55,235
      M 52,210 Q 58,188 68,178
      M 878,148 L 882,112 L 895,118 L 890,148
      M 858,108 L 858,295
      M 72,298 L 68,260
    `,
    wheels: [
      { cx: 235, cy: 378, r: 72 },
      { cx: 715, cy: 378, r: 72 }
    ],
    sections: [
      {
        id: 'front-bumper',
        label: 'Front Bumper',
        x: 100, y: 230,
        path: `M 155,298 L 155,168 L 195,118 L 235,92 Q 255,78 275,75 L 280,85 L 272,138 L 272,298 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'door',
        label: 'Door',
        x: 430, y: 195,
        path: `M 272,138 L 272,298 L 635,298 L 635,132 Z`,
        fill: 'rgba(100,140,255,0.10)'
      },
      {
        id: 'rear',
        label: 'Rear Quarter',
        x: 740, y: 195,
        path: `M 635,132 L 635,298 L 795,298 L 825,148 L 775,82 L 755,132 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'roof',
        label: 'Roof',
        x: 510, y: 58,
        path: `M 280,85 L 272,138 L 635,132 L 755,132 L 772,85 L 740,72 L 275,75 Z`,
        fill: 'rgba(80,200,120,0.10)'
      }
    ]
  },

  formula: {
    name: 'Formula Single-Seater',
    w: 1000, h: 380,
    body: `
      M 32,248
      L 25,210
      L 28,185
      Q 32,168 55,162
      L 105,158
      L 115,148
      L 140,142
      L 175,128
      L 210,118
      Q 240,108 265,105
      L 265,80
      L 295,75
      L 705,75
      L 735,80
      L 735,105
      Q 760,108 785,118
      L 820,128
      L 855,142
      L 880,148
      L 892,158
      L 942,162
      Q 968,168 972,185
      L 975,210
      L 968,248
      L 905,248
      L 900,268
      L 868,268
      L 862,248
      L 880,248
      L 885,192
      Q 882,178 872,172
      L 845,168
      L 820,128
      L 785,118
      L 735,105
      L 735,80
      L 705,75
      L 295,75
      L 265,80
      L 265,105
      L 215,118
      L 178,128
      L 155,168
      L 128,172
      Q 118,178 115,192
      L 120,248
      L 138,248
      L 132,268
      L 100,268
      L 95,248
      Z
    `,
    // Cockpit opening (not glass, just open)
    glass: `
      M 295,75
      L 288,115
      L 712,115
      L 705,75
      Z
    `,
    // Front and rear wings
    details: `
      M 32,248 L 32,228 L 8,228 L 8,255 L 32,255
      M 968,248 L 968,228 L 992,228 L 992,255 L 968,255
      M 120,248 L 880,248
      M 270,105 L 270,75
      M 730,105 L 730,75
    `,
    wheels: [
      { cx: 178, cy: 268, r: 58 },
      { cx: 822, cy: 268, r: 58 }
    ],
    sections: [
      {
        id: 'nosecone',
        label: 'Nose',
        x: 105, y: 155,
        path: `M 95,248 L 95,162 L 140,142 L 175,128 L 215,118 L 265,105 L 265,75 L 295,75 L 288,115 L 265,138 L 215,158 L 175,175 L 138,248 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'sidepod-left',
        label: 'Sidepod',
        x: 355, y: 155,
        path: `M 288,115 L 288,248 L 500,248 L 500,115 Z`,
        fill: 'rgba(100,140,255,0.10)'
      },
      {
        id: 'sidepod-right',
        label: 'Sidepod',
        x: 645, y: 155,
        path: `M 500,115 L 500,248 L 712,248 L 712,115 Z`,
        fill: 'rgba(100,140,255,0.10)'
      },
      {
        id: 'rear-body',
        label: 'Rear Body',
        x: 810, y: 155,
        path: `M 712,115 L 712,248 L 862,248 L 822,168 L 785,118 L 735,105 L 735,75 L 705,75 L 712,115 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'engine-cover',
        label: 'Engine Cover',
        x: 500, y: 62,
        path: `M 295,75 L 288,115 L 712,115 L 705,75 Z`,
        fill: 'rgba(80,200,120,0.10)'
      }
    ]
  },

  rally: {
    name: 'Rally / Road Car',
    w: 1000, h: 420,
    body: `
      M 88,305
      L 68,258
      L 72,205
      Q 78,175 105,162
      L 162,148
      L 215,125
      Q 240,110 262,102
      L 275,90
      L 285,72
      L 530,68
      L 565,72
      L 588,88
      Q 612,95 645,102
      L 705,118
      L 758,138
      L 788,158
      Q 808,172 815,198
      L 818,225
      L 818,270
      L 812,298
      L 812,305
      L 722,305
      Q 718,382 642,382
      Q 566,382 562,305
      L 395,305
      Q 391,382 315,382
      Q 239,382 235,305
      Z
    `,
    glass: `
      M 290,80
      L 282,145
      L 558,142
      L 560,80
      Z
      M 562,80
      L 562,142
      L 800,148
      L 808,98
      L 790,80
      Z
    `,
    details: `
      M 68,258 L 74,240
      M 72,205 Q 76,182 88,172
      M 812,298 L 818,270
      M 530,68 L 530,142
    `,
    wheels: [
      { cx: 315, cy: 382, r: 70 },
      { cx: 642, cy: 382, r: 70 }
    ],
    sections: [
      {
        id: 'hood',
        label: 'Hood',
        x: 178, y: 155,
        path: `M 235,305 L 235,162 L 215,125 Q 240,110 262,102 L 275,90 L 285,72 L 290,80 L 282,145 L 282,305 Z`,
        fill: 'rgba(255,103,31,0.12)'
      },
      {
        id: 'front-door',
        label: 'Front Door',
        x: 395, y: 185,
        path: `M 282,145 L 282,305 L 562,305 L 562,142 Z`,
        fill: 'rgba(100,140,255,0.10)'
      },
      {
        id: 'rear-door',
        label: 'Rear Door',
        x: 660, y: 185,
        path: `M 562,142 L 562,305 L 722,305 L 788,158 L 758,138 L 705,118 Z`,
        fill: 'rgba(100,140,255,0.10)'
      },
      {
        id: 'roof',
        label: 'Roof',
        x: 500, y: 55,
        path: `M 290,80 L 282,145 L 562,142 L 562,80 L 530,68 L 285,72 Z`,
        fill: 'rgba(80,200,120,0.10)'
      },
      {
        id: 'rear-hatch',
        label: 'Rear Hatch',
        x: 720, y: 80,
        path: `M 562,80 L 562,142 L 705,118 L 758,138 L 808,98 L 790,80 L 565,72 Z`,
        fill: 'rgba(200,100,255,0.10)'
      }
    ]
  }
};

// Palette of preset color swatches
const SWATCHES = [
  '#FFFFFF','#E8E8E8','#B0B0B0','#707070','#404040','#202020','#101010','#000000',
  '#FF671F','#FF3B00','#FF8C42','#FFBF00','#FFE066','#F9FF47','#C6F135','#66FF66',
  '#00CC66','#00A878','#00C4CC','#00A3FF','#0066FF','#3A3FD1','#6600CC','#CC00AA',
  '#FF0066','#CC1144','#8B0000','#5C1A0A','#2D1500','#010F3B','#001D6C','#0033A0'
];

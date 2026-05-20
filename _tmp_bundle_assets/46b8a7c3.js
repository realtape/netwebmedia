// Interactive AEO Dashboard — interactive tabs, legend toggles, range picker
// Mounted into #dashboard-root

(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const h = React.createElement;

  // ── Data ────────────────────────────────────────────────────────────────
  const ENGINES = [
    { key: 'chatgpt',    label: 'ChatGPT',    color: '#10a37f' },
    { key: 'claude',     label: 'Claude',     color: '#d97757' },
    { key: 'perplexity', label: 'Perplexity', color: '#21808d' },
    { key: 'gemini',     label: 'Gemini',     color: '#4f8bff' },
  ];

  function buildSeries(seed, days) {
    let s = seed;
    const rng = () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
    return ENGINES.map((e, i) => {
      const pts = [];
      let v = 30 + i * 12;
      for (let d = 0; d < days; d++) {
        v += (rng() - 0.42) * 8 + 1.6;
        v = Math.max(8, v);
        pts.push(Math.round(v));
      }
      return { ...e, points: pts };
    });
  }

  const QUERIES = [
    { q: 'best fractional CMO for SaaS startups', v: 'up',   pos: 1, cites: 14, engine: 'chatgpt' },
    { q: 'AEO vs SEO 2026',                       v: 'up',   pos: 2, cites: 11, engine: 'claude' },
    { q: 'how to get cited by ChatGPT',           v: 'up',   pos: 1, cites: 18, engine: 'chatgpt' },
    { q: 'AI-native marketing agency Spain',      v: 'flat', pos: 3, cites: 7,  engine: 'perplexity' },
    { q: 'LLM citation tracking tool',            v: 'up',   pos: 4, cites: 6,  engine: 'gemini' },
    { q: 'generative engine optimization pricing',v: 'down', pos: 6, cites: 3,  engine: 'claude' },
    { q: 'Perplexity ranking factors',            v: 'up',   pos: 2, cites: 9,  engine: 'perplexity' },
    { q: 'fractional CMO retainer cost',          v: 'flat', pos: 5, cites: 4,  engine: 'chatgpt' },
  ];

  const FEED_POOL = [
    { src: 'Claude',     msg: 'Cited in answer to "best fractional CMO 2026"' },
    { src: 'ChatGPT',    msg: 'Linked as primary source — AEO playbook' },
    { src: 'Perplexity', msg: 'New citation: 14 sources, position 2' },
    { src: 'Gemini',     msg: 'Indexed new pillar page · /aeo-audit' },
    { src: 'ChatGPT',    msg: 'Mentioned alongside HubSpot + Webflow' },
    { src: 'Claude',     msg: 'Schema.org markup parsed · FAQ block' },
    { src: 'Perplexity', msg: 'New citation: "how to rank in LLMs"' },
    { src: 'Gemini',     msg: 'Content snippet pulled · 1.2k impressions' },
  ];

  const COMPETITORS = [
    { name: 'HubSpot',   score: 92, share: 31, delta: -2 },
    { name: 'Netwebmedia', score: 87, share: 24, delta: 12, you: true },
    { name: 'Webflow',   score: 81, share: 18, delta: 4 },
    { name: 'Semrush',   score: 76, share: 14, delta: -6 },
    { name: 'Surfer',    score: 68, share: 9,  delta: 1 },
    { name: 'Others',    score: 0,  share: 4,  delta: 0 },
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────
  function Delta({ value }) {
    const up = value >= 0;
    return h('span', { className: `delta ${up ? 'up' : 'down'}` },
      h('svg', { width: 10, height: 10, viewBox: '0 0 10 10' },
        h('path', { d: up ? 'M2 7 L5 3 L8 7' : 'M2 3 L5 7 L8 3', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' })
      ),
      `${up ? '+' : ''}${value}%`
    );
  }

  // ── Animated radial ─────────────────────────────────────────────────────
  function RadialScore({ value = 87, label = 'AEO Score' }) {
    const [v, setV] = useState(0);
    useEffect(() => {
      let raf, start;
      const step = (t) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / 1100);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(eased * value);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [value]);

    const r = 38;
    const c = 2 * Math.PI * r;
    const offset = c - (v / 100) * c;

    return h('div', { className: 'radial' },
      h('svg', { width: 100, height: 100, viewBox: '0 0 100 100' },
        h('circle', { cx: 50, cy: 50, r, stroke: 'rgba(255,255,255,0.07)', strokeWidth: 6, fill: 'none' }),
        h('circle', {
          cx: 50, cy: 50, r,
          stroke: 'url(#radGrad)', strokeWidth: 6, fill: 'none',
          strokeLinecap: 'round',
          strokeDasharray: c,
          strokeDashoffset: offset,
          transform: 'rotate(-90 50 50)',
          style: { transition: 'stroke-dashoffset 0.05s linear' }
        }),
        h('defs', null,
          h('linearGradient', { id: 'radGrad', x1: 0, y1: 0, x2: 1, y2: 1 },
            h('stop', { offset: '0%', stopColor: '#ffb273' }),
            h('stop', { offset: '100%', stopColor: '#ff5a10' })
          )
        )
      ),
      h('div', { className: 'radial-text' },
        h('div', { className: 'radial-val' }, Math.round(v)),
        h('div', { className: 'radial-lbl' }, label)
      )
    );
  }

  // ── Multi-line chart (with toggleable engines, smart tooltip) ───────────
  function LineChart({ series, hidden, hovered, setHovered }) {
    const W = 600, H = 220, PAD_L = 36, PAD_R = 14, PAD_T = 16, PAD_B = 26;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const days = series[0].points.length;

    const visible = series.filter(s => !hidden[s.key]);
    const allVals = (visible.length ? visible : series).flatMap(s => s.points);
    const max = Math.max(...allVals) * 1.1;
    const min = 0;

    const xAt = (i) => PAD_L + (i / (days - 1)) * innerW;
    const yAt = (v) => PAD_T + innerH - ((v - min) / (max - min)) * innerH;
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => min + t * (max - min));

    const xLabels = days <= 7 ? [0,1,2,3,4,5,6] :
                    days <= 30 ? [0,7,14,21,29] : [0,15,30,45,60,89];

    return h('svg', { width: '100%', viewBox: `0 0 ${W} ${H}`, className: 'chart', preserveAspectRatio: 'none' },
      yTicks.map((v, i) =>
        h('g', { key: i },
          h('line', { x1: PAD_L, x2: W - PAD_R, y1: yAt(v), y2: yAt(v), stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }),
          h('text', { x: PAD_L - 8, y: yAt(v) + 3, textAnchor: 'end', className: 'tick' }, Math.round(v))
        )
      ),
      xLabels.map(i =>
        h('text', { key: i, x: xAt(i), y: H - 8, textAnchor: 'middle', className: 'tick' }, `D${i+1}`)
      ),
      hovered != null && h('line', {
        x1: xAt(hovered), x2: xAt(hovered),
        y1: PAD_T, y2: H - PAD_B,
        stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '3 3'
      }),
      series.map(s => {
        if (hidden[s.key]) return null;
        const pts = s.points.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
        const areaPts = `${PAD_L},${yAt(0)} ${pts} ${W - PAD_R},${yAt(0)}`;
        return h('g', { key: s.key, className: 'series', style: { opacity: 1 } },
          h('polygon', { points: areaPts, fill: s.color, opacity: 0.06 }),
          h('polyline', {
            points: pts,
            fill: 'none',
            stroke: s.color,
            strokeWidth: 2,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
            style: { filter: `drop-shadow(0 0 6px ${s.color}55)` }
          }),
          hovered != null && h('circle', {
            cx: xAt(hovered),
            cy: yAt(s.points[hovered]),
            r: 3.5,
            fill: '#0b1024',
            stroke: s.color,
            strokeWidth: 2
          })
        );
      }),
      h('rect', {
        x: PAD_L, y: PAD_T, width: innerW, height: innerH,
        fill: 'transparent', style: { cursor: 'crosshair' },
        onMouseMove: (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const idx = Math.max(0, Math.min(days - 1, Math.round(px * (days - 1))));
          setHovered(idx);
        },
        onMouseLeave: () => setHovered(null)
      })
    );
  }

  // ── Activity feed ───────────────────────────────────────────────────────
  function Feed({ pool, paused }) {
    const [items, setItems] = useState(() =>
      pool.slice(0, 5).map((it, i) => ({ ...it, t: i === 0 ? 'now' : `${i * 17}s`, id: i }))
    );
    const idRef = useRef(5);
    useEffect(() => {
      if (paused) return;
      const id = setInterval(() => {
        setItems(prev => {
          const next = pool[Math.floor(Math.random() * pool.length)];
          const fresh = { ...next, t: 'now', id: idRef.current++ };
          const aged = prev.map(p => ({ ...p, t: ageUp(p.t) }));
          return [fresh, ...aged].slice(0, 5);
        });
      }, 3200);
      return () => clearInterval(id);
    }, [paused, pool]);

    return h('div', { className: 'feed' },
      items.map((it, i) =>
        h('div', { className: 'feed-row', key: it.id, style: { '--i': i } },
          h('span', { className: 'feed-time' }, it.t),
          h('span', { className: `feed-src src-${it.src.toLowerCase()}` }, it.src),
          h('span', { className: 'feed-msg' }, it.msg)
        )
      )
    );
  }
  function ageUp(t) {
    if (t === 'now') return '3s';
    const m = t.match(/^(\d+)(s|m)$/);
    if (!m) return t;
    let n = parseInt(m[1], 10);
    if (m[2] === 's') {
      n += 3;
      if (n >= 60) return `${Math.floor(n / 60)}m`;
      return `${n}s`;
    }
    return `${n + 1}m`;
  }

  // ── Queries table ───────────────────────────────────────────────────────
  function QueryTable({ rows, expanded, setExpanded }) {
    return h('div', { className: 'qt' },
      h('div', { className: 'qt-head' },
        h('span', null, 'Query'),
        h('span', null, 'Pos'),
        h('span', null, 'Cites'),
        h('span', null, 'Δ')
      ),
      rows.map((r, i) =>
        h(React.Fragment, { key: r.q },
          h('div', {
            className: `qt-row ${expanded === r.q ? 'on' : ''}`,
            onClick: () => setExpanded(expanded === r.q ? null : r.q),
            style: { animationDelay: `${i * 50}ms` }
          },
            h('span', { className: 'qt-q' },
              h('span', { className: `qt-pill src-${r.engine}` }),
              r.q
            ),
            h('span', { className: 'qt-pos' }, `#${r.pos}`),
            h('span', { className: 'qt-c' }, r.cites),
            h('span', { className: `qt-t t-${r.v}` },
              r.v === 'up' ? '▲' : r.v === 'down' ? '▼' : '▬'
            )
          ),
          expanded === r.q && h('div', { className: 'qt-detail' },
            h('div', { className: 'qt-detail-row' },
              h('span', { className: 'lbl' }, 'Top citing engine'),
              h('span', { className: `feed-src src-${r.engine}` }, ENGINES.find(e => e.key === r.engine)?.label)
            ),
            h('div', { className: 'qt-detail-row' },
              h('span', { className: 'lbl' }, 'Avg. answer length'),
              h('span', { className: 'val' }, `${280 + r.cites * 12} tokens`)
            ),
            h('div', { className: 'qt-detail-row' },
              h('span', { className: 'lbl' }, 'Co-cited sources'),
              h('span', { className: 'val' }, 'hubspot.com, gartner.com, +4')
            )
          )
        )
      )
    );
  }

  // ── Citations donut (Citations tab) ─────────────────────────────────────
  function Donut({ series, hidden, onToggle }) {
    const visible = series.filter(s => !hidden[s.key]);
    const totals = series.map(s => ({
      ...s,
      total: s.points.reduce((a, b) => a + b, 0),
      visible: !hidden[s.key]
    }));
    const sum = totals.filter(t => t.visible).reduce((a, b) => a + b.total, 0) || 1;
    let acc = 0;
    const R = 56, CIRC = 2 * Math.PI * R;

    return h('div', { className: 'donut-wrap' },
      h('div', { className: 'donut' },
        h('svg', { width: 140, height: 140, viewBox: '0 0 140 140' },
          h('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: 'rgba(255,255,255,0.06)', strokeWidth: 14 }),
          totals.map(t => {
            if (!t.visible) return null;
            const frac = t.total / sum;
            const len = frac * CIRC;
            const dash = `${len} ${CIRC - len}`;
            const off = -acc;
            acc += len;
            return h('circle', {
              key: t.key, cx: 70, cy: 70, r: R, fill: 'none',
              stroke: t.color, strokeWidth: 14, strokeLinecap: 'butt',
              strokeDasharray: dash, strokeDashoffset: off,
              transform: 'rotate(-90 70 70)',
              style: { transition: 'stroke-dasharray 0.4s, stroke-dashoffset 0.4s' }
            });
          }),
          h('text', { x: 70, y: 68, textAnchor: 'middle', className: 'donut-num' }, sum.toLocaleString()),
          h('text', { x: 70, y: 84, textAnchor: 'middle', className: 'donut-lbl' }, 'CITATIONS')
        )
      ),
      h('div', { className: 'donut-legend' },
        totals.map(t =>
          h('button', {
            key: t.key,
            className: `donut-row ${t.visible ? '' : 'off'}`,
            onClick: () => onToggle(t.key)
          },
            h('span', { className: 'donut-dot', style: { background: t.color } }),
            h('span', { className: 'donut-name' }, t.label),
            h('span', { className: 'donut-pct' }, `${Math.round((t.total / sum) * 100) || 0}%`),
            h('span', { className: 'donut-val' }, t.total.toLocaleString())
          )
        )
      )
    );
  }

  // ── Competitors bars (Competitors tab) ──────────────────────────────────
  function CompBars() {
    const max = Math.max(...COMPETITORS.map(c => c.share));
    return h('div', { className: 'comp' },
      COMPETITORS.map(c =>
        h('div', { className: `comp-row ${c.you ? 'you' : ''}`, key: c.name },
          h('span', { className: 'comp-name' }, c.name, c.you ? h('span', { className: 'comp-you' }, 'YOU') : null),
          h('div', { className: 'comp-bar' },
            h('div', { className: 'comp-fill', style: { width: `${(c.share / max) * 100}%` } })
          ),
          h('span', { className: 'comp-share' }, `${c.share}%`),
          c.score ? h('span', { className: 'comp-score' }, c.score) : h('span', { className: 'comp-score muted' }, '—'),
          c.delta !== 0 ? h(Delta, { value: c.delta }) : h('span', { className: 'delta-skel' }, '–')
        )
      )
    );
  }

  // ── Top-level Dashboard ─────────────────────────────────────────────────
  function Dashboard() {
    const [tab, setTab] = useState('overview');
    const [range, setRange] = useState(30);
    const [seed, setSeed] = useState(7);
    const [hovered, setHovered] = useState(null);
    const [hidden, setHidden] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [paused, setPaused] = useState(false);

    const series = useMemo(() => buildSeries(seed, range), [seed, range]);
    const totals = series.map(s => s.points.reduce((a, b) => a + b, 0));
    const grand = totals.reduce((a, b) => a + b, 0);
    const visibleGrand = series.filter(s => !hidden[s.key])
      .map(s => s.points.reduce((a, b) => a + b, 0))
      .reduce((a, b) => a + b, 0);

    function refresh() {
      setRefreshing(true);
      setTimeout(() => {
        setSeed(s => s + 1);
        setRefreshing(false);
      }, 600);
    }
    function toggleEngine(k) {
      setHidden(prev => ({ ...prev, [k]: !prev[k] }));
    }

    return h('div', { className: 'dash' },
      // window chrome / header
      h('div', { className: 'dash-bar' },
        h('div', { className: 'dash-dots' },
          h('span', null), h('span', null), h('span', null)
        ),
        h('div', { className: 'dash-title' },
          h('span', { className: 'dash-mark' },
            h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none' },
              h('path', { d: 'M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6l4 4M5 19l4-4m6-6l4-4', stroke: '#ff7a2a', strokeWidth: 2, strokeLinecap: 'round' })
            )
          ),
          'AEO Pulse',
          h('span', { className: 'dash-sub' }, '/ netwebmedia.com')
        ),
        h('div', { className: 'dash-actions' },
          h('button', {
            className: `dash-btn ${refreshing ? 'spinning' : ''}`,
            onClick: refresh,
            title: 'Reload data'
          },
            h('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
              h('path', { d: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5' })
            ),
            refreshing ? 'Syncing…' : 'Refresh'
          ),
          h('span', { className: 'live-dot' }, h('span', null), 'LIVE')
        )
      ),

      // tabs
      h('div', { className: 'tabs' },
        ['overview', 'citations', 'queries', 'competitors'].map(k =>
          h('button', {
            key: k,
            className: `tab ${tab === k ? 'on' : ''}`,
            onClick: () => setTab(k)
          }, k)
        ),
        h('div', { className: 'range' },
          [7, 30, 90].map(d =>
            h('button', {
              key: d,
              className: `range-btn ${range === d ? 'on' : ''}`,
              onClick: () => setRange(d)
            }, `${d}d`)
          )
        )
      ),

      // ── Tab content ──
      tab === 'overview' && h('div', { className: 'pane' },
        h('div', { className: 'kpis' },
          h('div', { className: 'kpi kpi-score' },
            h(RadialScore, { value: 87 }),
            h('div', { className: 'kpi-meta' },
              h('div', { className: 'kpi-title' }, 'AEO Score'),
              h('div', { className: 'kpi-foot' }, h(Delta, { value: 12 }), 'vs. last month')
            )
          ),
          h('div', { className: 'kpi' },
            h('div', { className: 'kpi-label' }, 'AI Citations'),
            h('div', { className: 'kpi-big' }, visibleGrand.toLocaleString()),
            h('div', { className: 'kpi-foot' }, h(Delta, { value: 24 }), `· ${range}d`)
          ),
          h('div', { className: 'kpi' },
            h('div', { className: 'kpi-label' }, 'Avg. Position'),
            h('div', { className: 'kpi-big' }, '2.4'),
            h('div', { className: 'kpi-foot' }, h(Delta, { value: 38 }), 'rank lift')
          )
        ),
        h('div', { className: 'legend' },
          series.map(s =>
            h('button', {
              className: `legend-item ${hidden[s.key] ? 'off' : ''}`,
              key: s.key,
              onClick: () => toggleEngine(s.key),
              title: hidden[s.key] ? 'Show' : 'Hide'
            },
              h('span', { className: 'legend-dot', style: { background: s.color, boxShadow: hidden[s.key] ? 'none' : `0 0 8px ${s.color}aa` } }),
              s.label,
              h('span', { className: 'legend-val' }, s.points[s.points.length - 1])
            )
          )
        ),
        h('div', { className: 'chart-wrap' },
          h(LineChart, { series, hidden, hovered, setHovered })
        ),
        hovered != null && h('div', { className: 'tt-strip' },
          h('span', { className: 'tt-day' }, `DAY ${hovered + 1}`),
          series.map(s =>
            hidden[s.key] ? null :
            h('span', { className: 'tt-chip', key: s.key },
              h('span', { className: 'tt-dot', style: { background: s.color } }),
              s.label, ' ',
              h('b', null, s.points[hovered])
            )
          )
        )
      ),

      tab === 'citations' && h('div', { className: 'pane' },
        h(Donut, { series, hidden, onToggle: toggleEngine }),
        h('div', { className: 'cite-grid' },
          ENGINES.map(e => {
            const s = series.find(x => x.key === e.key);
            const total = s.points.reduce((a,b)=>a+b,0);
            return h('div', { className: 'cite-card', key: e.key, style: { borderColor: hidden[e.key] ? 'var(--line)' : `${e.color}55`, opacity: hidden[e.key] ? 0.4 : 1 } },
              h('div', { className: 'cite-head' },
                h('span', { className: `feed-src src-${e.key}` }, e.label),
                h(Delta, { value: 8 + Math.floor((s.points[s.points.length-1] - s.points[0]) / 2) })
              ),
              h('div', { className: 'cite-num' }, total.toLocaleString()),
              h('div', { className: 'cite-lbl' }, 'citations')
            );
          })
        )
      ),

      tab === 'queries' && h('div', { className: 'pane' },
        h('div', { className: 'panel' },
          h('div', { className: 'panel-head' },
            h('span', null, 'Tracked queries'),
            h('span', { className: 'panel-tag' }, `${QUERIES.length} active · click to expand`)
          ),
          h(QueryTable, { rows: QUERIES, expanded, setExpanded })
        )
      ),

      tab === 'competitors' && h('div', { className: 'pane' },
        h('div', { className: 'panel' },
          h('div', { className: 'panel-head' },
            h('span', null, 'AI share of voice'),
            h('span', { className: 'panel-tag' }, 'last 30 days')
          ),
          h(CompBars)
        )
      ),

      // footer: live activity (always visible)
      h('div', { className: 'foot' },
        h('div', { className: 'foot-head' },
          h('span', null, 'Live activity'),
          h('button', {
            className: 'pause-btn',
            onClick: () => setPaused(p => !p),
            title: paused ? 'Resume' : 'Pause'
          },
            paused ?
              h('svg', { width: 10, height: 10, viewBox: '0 0 10 10' }, h('path', { d: 'M2 1 L9 5 L2 9 Z', fill: 'currentColor' })) :
              h('svg', { width: 10, height: 10, viewBox: '0 0 10 10' }, h('rect', { x: 2, y: 1, width: 2, height: 8, fill: 'currentColor' }), h('rect', { x: 6, y: 1, width: 2, height: 8, fill: 'currentColor' }))
          ),
          h('span', { className: 'live-dot' }, h('span', null), paused ? 'PAUSED' : 'STREAMING')
        ),
        h(Feed, { pool: FEED_POOL, paused })
      )
    );
  }

  function mount() {
    if (!window.React || !window.ReactDOM) { setTimeout(mount, 50); return; }
    const root = ReactDOM.createRoot(document.getElementById('dashboard-root'));
    root.render(h(Dashboard));
  }
  mount();
})();

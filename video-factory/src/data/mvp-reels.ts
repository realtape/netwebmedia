// MVP Expansion v2 — 9-reel content + theme data.
// Source clips and music tracks are referenced by filename and resolved via
// Remotion's staticFile() from video-factory/public/.
//
// Theme rule: every reel anchors on NWM brand Navy + Orange. Each reel picks a
// distinct tertiary accent + motif so the 9-reel set reads as a series, not a
// template. AEO Starter (1A–3A), CMO Growth (4B–6B), CMO Scale (7C–9C).

export const BRAND = {
  navy: '#010F3B',
  navyDeep: '#000820',
  orange: '#FF671F',
  orangeLight: '#FF8C4A',
  white: '#FFFFFF',
  textOnNavy: '#EAF0FF',
  muted: '#8892B0',
} as const;

export const HANDLE = '@netwebmedia';
export const URL = 'netwebmedia.com';

export type TransitionKind =
  | 'zoom-punch'      // hard scale + slight rotate, 4-frame snap
  | 'light-flash'     // white frame flash 2 frames, then cut
  | 'scale-zoom'      // slow scale up 1.0 → 1.15 across cut
  | 'glitch-slide'    // RGB-split slide
  | 'matrix-wipe'     // vertical grid wipe with cyan trail
  | 'parallax-pan'    // bg pans opposite to fg
  | 'cinema-fade'     // 12-frame crossfade with slight push-in
  | 'depth-stack'     // 3-card stagger reveal
  | 'momentum-blur';  // motion-blur swipe

export type Beat = {
  t_start: number;       // seconds
  t_end: number;         // seconds
  clip: string;          // filename in public/clips/
  caption?: string;      // burn-in caption text
  emphasis?: string[];   // words within caption to highlight in orange
  transitionOut?: TransitionKind;
};

export type ReelTheme = {
  package: 'AEO Starter' | 'CMO Growth' | 'CMO Scale';
  // Tertiary accent — used for highlights, chart strokes, KPI cards.
  // Always paired with navy bg + orange CTA. Never replaces orange.
  tertiary: string;
  // Optional quaternary for proof-state highlights (mint, gold, etc.).
  quaternary?: string;
  motif: string;          // human-readable description of the visual motif
  music: string;          // filename in public/music/
  endCardCta: string;     // bottom-strip CTA on the 2s end card
  caption_style: 'tight' | 'cinematic' | 'punchy';
};

export type Reel = {
  id: string;             // e.g. reel_01_aeo_hook_en
  number: number;         // 1–9
  hook: string;           // hook headline shown over first beat
  package_url: string;    // landing URL on netwebmedia.com
  beats: Beat[];
  theme: ReelTheme;
  duration: number;       // total seconds including 2s end card
};

// ----------------------------------------------------------------------------
// AEO Starter — Character A (Skeptic Founder)
// Tertiary palette: warm amber accents on the AEO line. Proof state uses mint.
// ----------------------------------------------------------------------------

const themeAeoHook: ReelTheme = {
  package: 'AEO Starter',
  tertiary: '#FFB23F',
  motif: 'Skeptic squint · hard text drops · phone-glow reveal',
  music: 'aeo-tense-resolve.mp3',
  endCardCta: 'Get cited by AI · $249/mo',
  caption_style: 'punchy',
};

const themeAeoDemo: ReelTheme = {
  ...themeAeoHook,
  tertiary: '#FFB23F',
  quaternary: '#FF3B3B',
  motif: 'Schema markup wipes · error→fix flash · code rhythm',
  caption_style: 'tight',
};

const themeAeoProof: ReelTheme = {
  ...themeAeoHook,
  tertiary: '#FFB23F',
  quaternary: '#5EE6A8',
  motif: 'Number counter ramp · line-chart climb · proof glow',
  caption_style: 'cinematic',
};

// ----------------------------------------------------------------------------
// CMO Growth — Character B (The Operator)
// Tertiary palette: electric cyan for operations + lime for proof.
// ----------------------------------------------------------------------------

const themeGrowthHook: ReelTheme = {
  package: 'CMO Growth',
  tertiary: '#22D3EE',
  motif: 'Seven tabs closing · single dashboard reveal · kinetic typography',
  music: 'growth-operator.mp3',
  endCardCta: 'One stack. One CMO. · $999/mo',
  caption_style: 'punchy',
};

const themeGrowthDemo: ReelTheme = {
  ...themeGrowthHook,
  tertiary: '#22D3EE',
  motif: 'Whiteboard list · calendar fill stagger · CRM populate',
  caption_style: 'tight',
};

const themeGrowthProof: ReelTheme = {
  ...themeGrowthHook,
  tertiary: '#22D3EE',
  quaternary: '#A8E22D',
  motif: 'Arrow draw 0→47 · email-preview push · whiteboard pan',
  caption_style: 'cinematic',
};

// ----------------------------------------------------------------------------
// CMO Scale — Character C (The Closer)
// Tertiary palette: warm gold + platinum for premium executive feel.
// ----------------------------------------------------------------------------

const themeScaleHook: ReelTheme = {
  package: 'CMO Scale',
  tertiary: '#FFC857',
  motif: 'Window light push-in · chaos→system contrast · cinematic fade',
  music: 'scale-cinematic.mp3',
  endCardCta: 'Marketing as a system · $2,490/mo',
  caption_style: 'cinematic',
};

const themeScaleDemo: ReelTheme = {
  ...themeScaleHook,
  tertiary: '#FFC857',
  quaternary: '#C0D6F0',
  motif: 'KPI card stack · workflow node glow · premium UI',
  caption_style: 'tight',
};

const themeScaleProof: ReelTheme = {
  ...themeScaleHook,
  tertiary: '#FFC857',
  quaternary: '#3FE07A',
  motif: 'Logo wall · revenue chart climb · executive close',
  caption_style: 'cinematic',
};

// ----------------------------------------------------------------------------
// 9-reel manifest (EN). ES variants are produced by swapping captions only.
// ----------------------------------------------------------------------------

export const REELS: Reel[] = [
  {
    id: 'reel_01_aeo_hook_en',
    number: 1,
    hook: 'AI is the new Google.',
    package_url: 'netwebmedia.com/aeo-starter',
    duration: 14,
    theme: themeAeoHook,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_01_aeo_hero_skeptic-founder.mp4',
        caption: '60% of searches end without a click.',
        emphasis: ['60%', 'without a click'],
        transitionOut: 'zoom-punch',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_01_aeo_broll_chatgpt-phone.mp4',
        caption: "Your buyers don't Google. They ask AI.",
        emphasis: ['ask AI'],
        transitionOut: 'light-flash',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_01_aeo_hero_skeptic-founder.mp4',
        caption: "If AI doesn't know your business — you're invisible.",
        emphasis: ['invisible'],
      },
    ],
  },
  {
    id: 'reel_02_aeo_demo_en',
    number: 2,
    hook: 'What AEO actually does.',
    package_url: 'netwebmedia.com/aeo-starter',
    duration: 16,
    theme: themeAeoDemo,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_02_aeo_hero_phone-reaction.mp4',
        caption: 'Search "best [niche] near me" → competitor wins.',
        emphasis: ['competitor wins'],
        transitionOut: 'light-flash',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_02_aeo_hero_phone-reaction.mp4',
        caption: "That should've been us.",
        emphasis: ["should've"],
        transitionOut: 'zoom-punch',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_02_aeo_broll_schema-markup.mp4',
        caption: 'AEO injects what AI needs to cite you.',
        emphasis: ['cite you'],
        transitionOut: 'scale-zoom',
      },
      {
        t_start: 12,
        t_end: 14,
        clip: 'reel_02_aeo_hero_phone-reaction.mp4',
        caption: 'Three weeks. Citation earned.',
        emphasis: ['Citation earned'],
      },
    ],
  },
  {
    id: 'reel_03_aeo_proof_en',
    number: 3,
    hook: 'We audited 50 sites.',
    package_url: 'netwebmedia.com/aeo-starter',
    duration: 14,
    theme: themeAeoProof,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_03_aeo_hero_audit-reports.mp4',
        caption: '50 SMBs audited last quarter.',
        emphasis: ['50'],
        transitionOut: 'scale-zoom',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_03_aeo_hero_audit-reports.mp4',
        caption: '47 had zero AEO. Zero citations.',
        emphasis: ['47', 'Zero'],
        transitionOut: 'light-flash',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_03_aeo_broll_citation-chart.mp4',
        caption: '90 days → 4× the AI citation rate.',
        emphasis: ['4×'],
      },
    ],
  },
  {
    id: 'reel_04_growth_hook_en',
    number: 4,
    hook: 'Stop duct-taping 7 tools.',
    package_url: 'netwebmedia.com/cmo-growth',
    duration: 14,
    theme: themeGrowthHook,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_04_growth_hero_operator-laptop.mp4',
        caption: 'Mailchimp. HubSpot. Canva. Trello. Buffer. GA4.',
        emphasis: [],
        transitionOut: 'glitch-slide',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_04_growth_hero_operator-laptop.mp4',
        caption: 'Each one promised easier. None delivered.',
        emphasis: ['None'],
        transitionOut: 'matrix-wipe',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_04_growth_broll_tabs-closing.mp4',
        caption: 'One stack. One CMO. One bill.',
        emphasis: ['One stack', 'One CMO'],
      },
    ],
  },
  {
    id: 'reel_05_growth_demo_en',
    number: 5,
    hook: 'What CMO Growth gives you.',
    package_url: 'netwebmedia.com/cmo-growth',
    duration: 14,
    theme: themeGrowthDemo,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_05_growth_hero_whiteboard-list.mp4',
        caption: 'Blog. Social. Email. Ads. One calendar.',
        emphasis: ['One calendar'],
        transitionOut: 'matrix-wipe',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_05_growth_broll_calendar-fill.mp4',
        caption: 'Everything scheduled. Everything tracked.',
        emphasis: ['scheduled', 'tracked'],
        transitionOut: 'zoom-punch',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_05_growth_hero_whiteboard-list.mp4',
        caption: 'Done-for-you. Not done-by-you.',
        emphasis: ['Done-for-you'],
      },
    ],
  },
  {
    id: 'reel_06_growth_proof_en',
    number: 6,
    hook: 'Real client. Real numbers.',
    package_url: 'netwebmedia.com/cmo-growth',
    duration: 14,
    theme: themeGrowthProof,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_06_growth_hero_whiteboard-arrow.mp4',
        caption: 'Month 1: zero leads.',
        emphasis: ['zero'],
        transitionOut: 'parallax-pan',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_06_growth_hero_whiteboard-arrow.mp4',
        caption: 'Month 6: 47 qualified leads/mo from content.',
        emphasis: ['47'],
        transitionOut: 'scale-zoom',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_06_growth_broll_email-scale.mp4',
        caption: '"We\'re ready to scale."',
        emphasis: ['scale'],
      },
    ],
  },
  {
    id: 'reel_07_scale_hook_en',
    number: 7,
    hook: 'Marketing as a system.',
    package_url: 'netwebmedia.com/cmo-scale',
    duration: 14,
    theme: themeScaleHook,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_07_scale_hero_executive-window.mp4',
        caption: 'Most businesses do marketing in spurts.',
        emphasis: ['spurts'],
        transitionOut: 'cinema-fade',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_07_scale_broll_chaos-montage.mp4',
        caption: 'Big campaign. Quiet. Big campaign. Quiet.',
        emphasis: ['Quiet'],
        transitionOut: 'cinema-fade',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_07_scale_hero_executive-window.mp4',
        caption: 'Scale isn\'t more effort. It\'s a system that compounds.',
        emphasis: ['compounds'],
      },
    ],
  },
  {
    id: 'reel_08_scale_demo_en',
    number: 8,
    hook: 'Inside the Scale stack.',
    package_url: 'netwebmedia.com/cmo-scale',
    duration: 14,
    theme: themeScaleDemo,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_08_scale_hero_conference-table.mp4',
        caption: 'Strategy · Content · Paid · Automation · Analytics.',
        emphasis: ['Analytics'],
        transitionOut: 'depth-stack',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_08_scale_broll_kpi-dashboard.mp4',
        caption: 'All five — owned. Measured. Optimized weekly.',
        emphasis: ['Optimized weekly'],
        transitionOut: 'depth-stack',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_08_scale_broll_workflow-nodes.mp4',
        caption: 'AI runs the funnel while you run the company.',
        emphasis: ['AI runs the funnel'],
      },
    ],
  },
  {
    id: 'reel_09_scale_proof_en',
    number: 9,
    hook: 'When growth becomes inevitable.',
    package_url: 'netwebmedia.com/cmo-scale',
    duration: 14,
    theme: themeScaleProof,
    beats: [
      {
        t_start: 0,
        t_end: 3,
        clip: 'reel_09_scale_hero_phone-call-window.mp4',
        caption: 'Q4: closed. Now hiring three reps.',
        emphasis: ['hiring three reps'],
        transitionOut: 'momentum-blur',
      },
      {
        t_start: 3,
        t_end: 7,
        clip: 'reel_09_scale_broll_logos-revenue.mp4',
        caption: '18 months. MRR up 4×. CAC down 38%.',
        emphasis: ['4×', '38%'],
        transitionOut: 'cinema-fade',
      },
      {
        t_start: 7,
        t_end: 12,
        clip: 'reel_09_scale_hero_phone-call-window.mp4',
        caption: 'Better systems. Not more hours.',
        emphasis: ['Better systems'],
      },
    ],
  },
];

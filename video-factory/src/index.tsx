import { Composition, registerRoot } from 'remotion';
import { QuoteCard, quoteCardSchema } from './compositions/QuoteCard';
import { ProductReel, productReelSchema } from './compositions/ProductReel';
import { BeforeAfter, beforeAfterSchema } from './compositions/BeforeAfter';
import { HiggsfieldRemix } from './compositions/HiggsfieldRemix';

const FPS = 30;
// HF source is 15.04s — render slightly short to land cleanly inside the audio tail.
const HF_DURATION = FPS * 15;

// 1080x1920 vertical (upscaled from the 720x1280 source — keeps NWM template parity)
const HF_W = 1080;
const HF_H = 1920;
const HF_SOURCE = 'hf-base.mp4';
const NAVY = '#010F3B';
const ORANGE = '#FF671F';

// 6 variations: 3 angle (AEO / Growth / Speed) × 2 languages (EN / ES)
// Edit copy in `defaultProps` and re-render to iterate — no code changes needed.
type Variant = {
  id: string;
  lang: 'en' | 'es';
  hook: string;
  sub: string;
  cta: string;
  handle: string;
  accent: string;
};

const VARIANTS: Variant[] = [
  {
    id: 'hf-aeo-en',
    lang: 'en',
    hook: 'AI answers are eating Google.',
    sub: 'If ChatGPT and Perplexity can’t cite you, you don’t exist.',
    cta: 'Win the AI citation war.',
    handle: '@netwebmedia',
    accent: ORANGE,
  },
  {
    id: 'hf-aeo-es',
    lang: 'es',
    hook: 'La IA se está comiendo a Google.',
    sub: 'Si ChatGPT y Perplexity no te citan, no existes.',
    cta: 'Gana la guerra de las citas IA.',
    handle: '@netwebmedia',
    accent: ORANGE,
  },
  {
    id: 'hf-growth-en',
    lang: 'en',
    hook: 'One dashboard. Every lead.',
    sub: 'Capture, score, and follow up — while you sleep.',
    cta: 'Your CRM, finally yours.',
    handle: '@netwebmedia',
    accent: '#22d3ee',
  },
  {
    id: 'hf-growth-es',
    lang: 'es',
    hook: 'Un panel. Cada lead.',
    sub: 'Captura, califica y da seguimiento — mientras duermes.',
    cta: 'Tu CRM, por fin tuyo.',
    handle: '@netwebmedia',
    accent: '#22d3ee',
  },
  {
    id: 'hf-speed-en',
    lang: 'en',
    hook: 'From audit to launch in 14 days.',
    sub: 'Most agencies take six months. We don’t.',
    cta: 'Ship faster. Grow faster.',
    handle: '@netwebmedia',
    accent: '#34d399',
  },
  {
    id: 'hf-speed-es',
    lang: 'es',
    hook: 'De auditoría a lanzamiento en 14 días.',
    sub: 'La mayoría tarda seis meses. Nosotros no.',
    cta: 'Lanza rápido. Crece rápido.',
    handle: '@netwebmedia',
    accent: '#34d399',
  },
];

export const RemotionRoot: React.FC = () => (
  <>
    {/* Legacy templates kept intact */}
    <Composition
      id="quote-card"
      component={QuoteCard}
      durationInFrames={FPS * 10}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        quote: 'Your brand deserves AI-powered growth.',
        author: 'NetWebMedia',
        brand_color: '#FF671F',
      }}
    />
    <Composition
      id="product-reel"
      component={ProductReel}
      durationInFrames={FPS * 18}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        product_name: 'NWM CRM',
        tagline: 'One dashboard, every lead, zero chaos.',
        scene1_text: 'Capture every lead instantly',
        scene2_text: 'Automate follow-ups',
        scene3_text: 'Close 3x more deals',
        cta: 'Get started →',
        brand_color: '#8b5cf6',
      }}
    />
    <Composition
      id="before-after"
      component={BeforeAfter}
      durationInFrames={FPS * 12}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        before_label: 'Before',
        before_img: 'https://netwebmedia.com/assets/og-cover.svg',
        after_label: 'After',
        after_img: 'https://netwebmedia.com/assets/og-cover.svg',
        caption: 'What a difference one sprint makes.',
        brand_color: '#10b981',
      }}
    />

    {/* Higgsfield Remix — 6 NWM-branded variants of the same source clip */}
    {VARIANTS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={HiggsfieldRemix}
        durationInFrames={HF_DURATION}
        fps={FPS}
        width={HF_W}
        height={HF_H}
        defaultProps={{
          source: HF_SOURCE,
          hook_text: v.hook,
          sub_text: v.sub,
          cta_text: v.cta,
          handle: v.handle,
          accent: v.accent,
          accent_dark: NAVY,
        }}
      />
    ))}
  </>
);

registerRoot(RemotionRoot);

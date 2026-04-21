import { Composition, registerRoot } from 'remotion';
import { QuoteCard, quoteCardSchema } from './compositions/QuoteCard';
import { ProductReel, productReelSchema } from './compositions/ProductReel';
import { BeforeAfter, beforeAfterSchema } from './compositions/BeforeAfter';

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
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
  </>
);

registerRoot(RemotionRoot);

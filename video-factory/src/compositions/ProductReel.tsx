import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export type ProductReelProps = {
  product_name: string;
  tagline: string;
  scene1_text: string;
  scene2_text: string;
  scene3_text: string;
  cta: string;
  brand_color?: string;
};

export const productReelSchema = {};

const Scene: React.FC<{ label: string; text: string; color: string; idx: number }> = ({ label, text, color, idx }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at 30% 30%, ${color}33, #0b0f1a)`,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 100,
    }}>
      <div style={{ opacity: fade, textAlign: 'center' }}>
        <div style={{ fontSize: 36, color, fontWeight: 800, letterSpacing: 8, marginBottom: 30 }}>
          STEP {idx}
        </div>
        <div style={{ fontSize: 88, color: '#fff', fontWeight: 800, lineHeight: 1.1 }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ProductReel: React.FC<ProductReelProps> = ({
  product_name, tagline, scene1_text, scene2_text, scene3_text, cta, brand_color = '#8b5cf6',
}) => {
  const { fps } = useVideoConfig();
  const len = fps * 18;
  const sceneLen = Math.floor((len - fps * 6) / 3); // 6s total for intro+outro, 4s per scene

  return (
    <AbsoluteFill style={{ background: '#0b0f1a', fontFamily: 'Inter, sans-serif' }}>
      <Sequence from={0} durationInFrames={fps * 3}>
        <AbsoluteFill style={{
          background: `linear-gradient(135deg, ${brand_color}, #0b0f1a)`,
          justifyContent: 'center', alignItems: 'center', padding: 80, textAlign: 'center',
        }}>
          <div style={{ fontSize: 108, fontWeight: 900, color: '#fff', marginBottom: 40 }}>{product_name}</div>
          <div style={{ fontSize: 52, color: 'rgba(255,255,255,0.85)', fontWeight: 500, maxWidth: 900 }}>
            {tagline}
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={fps * 3} durationInFrames={sceneLen}>
        <Scene label="Step 1" text={scene1_text} color={brand_color} idx={1} />
      </Sequence>
      <Sequence from={fps * 3 + sceneLen} durationInFrames={sceneLen}>
        <Scene label="Step 2" text={scene2_text} color={brand_color} idx={2} />
      </Sequence>
      <Sequence from={fps * 3 + sceneLen * 2} durationInFrames={sceneLen}>
        <Scene label="Step 3" text={scene3_text} color={brand_color} idx={3} />
      </Sequence>

      <Sequence from={fps * 3 + sceneLen * 3} durationInFrames={fps * 3}>
        <AbsoluteFill style={{
          background: `linear-gradient(315deg, ${brand_color}, #0b0f1a)`,
          justifyContent: 'center', alignItems: 'center', padding: 80,
        }}>
          <div style={{
            padding: '40px 80px', borderRadius: 9999, background: '#fff',
            color: brand_color, fontSize: 72, fontWeight: 800,
          }}>
            {cta}
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

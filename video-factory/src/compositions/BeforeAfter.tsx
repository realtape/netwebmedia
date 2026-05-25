import { AbsoluteFill, Img, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export type BeforeAfterProps = {
  before_label: string;
  before_img: string;
  after_label: string;
  after_img: string;
  caption?: string;
  brand_color?: string;
};

export const beforeAfterSchema = {};

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  before_label, before_img, after_label, after_img, caption, brand_color = '#10b981',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Slide reveal across the middle axis
  const revealAt = fps * 2; // start reveal at 2s
  const reveal = interpolate(frame, [revealAt, revealAt + fps * 3], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0b0f1a', fontFamily: 'Inter, sans-serif' }}>
      {/* Before image (full) */}
      <AbsoluteFill>
        <Img src={before_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', top: 80, left: 60,
          background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '16px 32px',
          borderRadius: 9999, fontSize: 52, fontWeight: 800,
        }}>{before_label}</div>
      </AbsoluteFill>

      {/* After image (wipes in from right) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${100 - reveal}%)` }}>
        <AbsoluteFill>
          <Img src={after_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', top: 80, right: 60,
            background: brand_color, color: '#fff', padding: '16px 32px',
            borderRadius: 9999, fontSize: 52, fontWeight: 800,
          }}>{after_label}</div>
        </AbsoluteFill>
      </div>

      {/* Divider line during reveal */}
      {reveal > 0 && reveal < 100 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${100 - reveal}%`, width: 8, background: brand_color, boxShadow: `0 0 40px ${brand_color}`,
        }} />
      )}

      {/* Caption */}
      {caption ? (
        <div style={{
          position: 'absolute', bottom: 120, left: 60, right: 60,
          textAlign: 'center', background: 'rgba(0,0,0,0.7)', color: '#fff',
          padding: '32px 48px', borderRadius: 32, fontSize: 52, fontWeight: 700, lineHeight: 1.25,
        }}>
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

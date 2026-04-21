import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';

export type QuoteCardProps = {
  quote: string;
  author: string;
  brand_color?: string;
  logo_url?: string;
};

export const quoteCardSchema = { /* runtime validation stub */ };

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, author, brand_color = '#FF671F', logo_url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale  = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${brand_color}, #1a1a2e)`,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 80,
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ opacity: fadeIn, transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{ fontSize: 96, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 60, textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          "{quote}"
        </div>
        <div style={{ fontSize: 44, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          — {author}
        </div>
        {logo_url ? (
          <div style={{ marginTop: 80 }}>
            <Img src={logo_url} style={{ width: 160, height: 'auto' }} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

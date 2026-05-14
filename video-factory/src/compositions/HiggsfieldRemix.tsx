import {
  AbsoluteFill,
  Video,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  staticFile,
} from 'remotion';

export type HiggsfieldRemixProps = {
  source: string;
  hook_text: string;   // small top caption (0–2.5s)
  sub_text: string;    // bottom caption (2.5–13s)
  cta_text: string;    // pill text — small the whole time, pulses end (always visible)
  handle: string;      // small corner sticker
  accent: string;
  accent_dark: string;
};

export const higgsfieldRemixSchema = {};

const safe = (s: string) => s ?? '';

// =============================================================================
// TikTok/Reels overlay model — let the source breathe at 1.0x.
// Everything sits in top/bottom safe zones so the face is never blocked.
// =============================================================================

// ---------- Always-on layers ----------

const HandleSticker: React.FC<{ handle: string; accent: string }> = ({ handle, accent }) => (
  <div style={{
    position: 'absolute',
    top: 50,
    right: 36,
    padding: '8px 18px',
    borderRadius: 9999,
    background: 'rgba(0,0,0,0.55)',
    border: `1.5px solid ${accent}`,
    color: '#fff',
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 1,
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
    zIndex: 6,
    pointerEvents: 'none',
  }}>{handle}</div>
);

// Persistent CTA pill at the bottom-center. Pulses in last 2s.
const CtaPill: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 220, mass: 0.6 } });
  const pulseStart = durationInFrames - fps * 2;
  const pulse =
    frame > pulseStart
      ? 1 + 0.12 * Math.sin(((frame - pulseStart) / fps) * Math.PI * 4)
      : 1;
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 56,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 7,
      pointerEvents: 'none',
    }}>
      <div style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px) scale(${pulse})`,
        padding: '14px 30px',
        borderRadius: 9999,
        background: accent,
        color: '#010F3B',
        fontSize: 30,
        fontWeight: 900,
        letterSpacing: 1.5,
        fontFamily: 'Inter, sans-serif',
        boxShadow: `0 0 28px ${accent}88, 0 4px 18px rgba(0,0,0,0.5)`,
      }}>{safe(text)} · netwebmedia.com</div>
    </div>
  );
};

const ProgressBar: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 6,
      background: 'rgba(255,255,255,0.18)', zIndex: 8,
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: accent,
        boxShadow: `0 0 12px ${accent}`,
      }} />
    </div>
  );
};

// ---------- Sequenced caption layers ----------

// Top caption — small, doesn't block the face. 0–2.5s.
const TopCaption: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 280, mass: 0.5 } });
  const exit = interpolate(frame, [fps * 2.1, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = enter * (1 - exit);
  const lift = interpolate(enter, [0, 1], [-30, 0]);
  return (
    <div style={{
      position: 'absolute',
      top: 120,
      left: 30,
      right: 30,
      textAlign: 'center',
      opacity,
      transform: `translateY(${lift + exit * -20}px)`,
      zIndex: 5,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'inline-block',
        padding: '14px 22px',
        background: 'rgba(0,0,0,0.7)',
        border: `2.5px solid ${accent}`,
        borderRadius: 14,
        color: '#fff',
        fontSize: 44,
        fontWeight: 900,
        lineHeight: 1.1,
        fontFamily: 'Poppins, Inter, sans-serif',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        maxWidth: '94%',
      }}>{safe(text)}</div>
    </div>
  );
};

// Bottom caption — TikTok auto-caption style. 2.5–13s.
const BottomCaption: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 300, mass: 0.45 } });
  const exit = interpolate(frame, [fps * 10.0, fps * 10.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = enter * (1 - exit);
  const lift = interpolate(enter, [0, 1], [40, 0]);
  return (
    <div style={{
      position: 'absolute',
      left: 30,
      right: 30,
      bottom: 150,
      textAlign: 'center',
      opacity,
      transform: `translateY(${lift}px)`,
      zIndex: 5,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'inline-block',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.78)',
        borderLeft: `6px solid ${accent}`,
        borderRadius: 12,
        color: '#fff',
        fontSize: 38,
        fontWeight: 700,
        lineHeight: 1.2,
        fontFamily: 'Inter, sans-serif',
        maxWidth: '94%',
        textShadow: '0 2px 6px rgba(0,0,0,0.85)',
      }}>{safe(text)}</div>
    </div>
  );
};

// ---------- Main composition ----------

export const HiggsfieldRemix: React.FC<HiggsfieldRemixProps> = ({
  source,
  hook_text,
  sub_text,
  cta_text,
  handle,
  accent = '#FF671F',
  accent_dark = '#010F3B',
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Base source — natural 1.0x playback, no scaling, no cuts. The face IS the content. */}
      <AbsoluteFill>
        <Video
          src={staticFile(source)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted={false}
          volume={0.7}
        />
      </AbsoluteFill>

      {/* Light bottom-edge fade so the caption + pill have readability — top stays clean for the face */}
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 92%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />

      {/* HOOK 0–2.5s — small top caption */}
      <Sequence from={0} durationInFrames={Math.floor(fps * 2.5)}>
        <TopCaption text={hook_text} accent={accent} />
      </Sequence>

      {/* SUB 2.5–13s — bottom caption */}
      <Sequence from={Math.floor(fps * 2.5)} durationInFrames={Math.floor(fps * 10.5)}>
        <BottomCaption text={sub_text} accent={accent} />
      </Sequence>

      {/* Always-on: corner handle, persistent CTA pill, progress bar */}
      <HandleSticker handle={handle} accent={accent} />
      <CtaPill text={cta_text} accent={accent} />
      <ProgressBar accent={accent} />
    </AbsoluteFill>
  );
};

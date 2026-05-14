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
  hook_text: string;
  sub_text: string;
  cta_text: string;
  handle: string;
  accent: string;
  accent_dark: string;
};

export const higgsfieldRemixSchema = {};

const safe = (s: string) => s ?? '';

// =============================================================================
// Pacing model — 15s vertical reel, 30fps = 450 frames
// 0.00 – 2.00s   HOOK punch (60 frames)
// 2.00 – 5.50s   Source clip beat A + sub line 1
// 5.50 – 9.00s   Source clip beat B (snap-zoom cut) + sub line 2 OR same sub
// 9.00 – 15.0s   CTA card (180 frames)
// Source video: 15s real-time × 1.5 = 10s usable → ends right under CTA start
// =============================================================================

// ---------- Layers ----------

const TopRibbon: React.FC<{ handle: string; accent: string; visible: boolean }> = ({ handle, accent, visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      <div style={{
        padding: '10px 26px',
        borderRadius: 9999,
        background: 'rgba(0,0,0,0.55)',
        border: `2px solid ${accent}`,
        color: '#fff',
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 1.5,
        fontFamily: 'Inter, sans-serif',
        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
      }}>{safe(handle)}</div>
    </div>
  );
};

const ProgressBar: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 10,
      background: 'rgba(255,255,255,0.18)', zIndex: 6,
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: accent,
        boxShadow: `0 0 18px ${accent}, 0 0 6px ${accent}`,
      }} />
    </div>
  );
};

// Snap-zoom layer applied to the BASE video group.
// Three cuts: 0s (1.10), 2.0s (1.00), 5.5s (1.18), settling back to 1.05.
// Each cut transitions in ~3 frames (snap) for "edit" feel.
const useSnapZoom = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut1 = fps * 2.0;
  const cut2 = fps * 5.5;
  if (frame < cut1) {
    return interpolate(frame, [0, cut1], [1.10, 1.02], { extrapolateRight: 'clamp' });
  }
  if (frame < cut1 + 3) {
    return interpolate(frame, [cut1, cut1 + 3], [1.02, 1.00], { extrapolateRight: 'clamp' });
  }
  if (frame < cut2) {
    return interpolate(frame, [cut1 + 3, cut2], [1.00, 1.05], { extrapolateRight: 'clamp' });
  }
  if (frame < cut2 + 3) {
    return interpolate(frame, [cut2, cut2 + 3], [1.05, 1.18], { extrapolateRight: 'clamp' });
  }
  return interpolate(frame, [cut2 + 3, fps * 9], [1.18, 1.05], { extrapolateRight: 'clamp' });
};

// ---------- Text layers ----------

const Hook: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 10, stiffness: 280, mass: 0.5 } });
  const exit = interpolate(frame, [fps * 1.65, fps * 2.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(enter, [0, 1], [1.45, 1]) + exit * 0.35;
  const opacity = interpolate(enter, [0, 0.5], [0, 1]) * (1 - exit);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: 220,
        left: 30,
        right: 30,
        textAlign: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}>
        <div style={{
          display: 'inline-block',
          padding: '28px 32px',
          background: 'rgba(1,15,59,0.82)',
          border: `4px solid ${accent}`,
          borderRadius: 24,
          color: '#fff',
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1.0,
          fontFamily: 'Poppins, Inter, sans-serif',
          textShadow: `0 4px 14px rgba(0,0,0,0.85), 0 0 28px ${accent}88`,
          maxWidth: '95%',
        }}>{safe(text)}</div>
      </div>
    </AbsoluteFill>
  );
};

const Sub: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 300, mass: 0.4 } });
  // Quick mid-snap at ~3.5s into the sequence to feel like a re-cut
  const midSnap = interpolate(frame, [fps * 3.3, fps * 3.4, fps * 3.55], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [fps * 6.7, fps * 7.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = enter * (1 - exit);
  const lift = interpolate(enter, [0, 1], [50, 0]);
  const snapKick = midSnap * 8;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        bottom: 280,
        left: 40,
        right: 40,
        opacity,
        textAlign: 'center',
        transform: `translateY(${lift + exit * -50}px) translateX(${snapKick}px)`,
      }}>
        <div style={{
          display: 'inline-block',
          padding: '22px 28px',
          background: 'rgba(0,0,0,0.7)',
          borderLeft: `8px solid ${accent}`,
          borderRadius: 16,
          color: '#fff',
          fontSize: 46,
          fontWeight: 700,
          lineHeight: 1.22,
          fontFamily: 'Inter, sans-serif',
          maxWidth: '92%',
          textShadow: '0 2px 6px rgba(0,0,0,0.75)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>{safe(text)}</div>
      </div>
    </AbsoluteFill>
  );
};

const FlashCut: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [0, Math.floor(fps * 0.06), Math.floor(fps * 0.22)], [0, 0.95, 0], { extrapolateRight: 'clamp' });
  if (flash <= 0) return null;
  return (
    <AbsoluteFill style={{
      background: accent,
      opacity: flash,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }} />
  );
};

const CTA: React.FC<{ text: string; accent: string; accentDark: string }> = ({ text, accent, accentDark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 240, mass: 0.6 } });
  const ctaPop = spring({ frame: Math.max(0, frame - fps * 0.25), fps, config: { damping: 10, stiffness: 260, mass: 0.45 } });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(160deg, ${accentDark} 0%, ${accentDark} 55%, #000 100%)`,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: 1400, height: 1400, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}33 0%, transparent 60%)`,
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        filter: 'blur(20px)',
      }} />
      <div style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * 50}px)`,
        textAlign: 'center',
        zIndex: 1,
      }}>
        <div style={{
          fontSize: 32,
          color: accent,
          fontWeight: 800,
          letterSpacing: 7,
          marginBottom: 30,
          fontFamily: 'Inter, sans-serif',
          textShadow: `0 0 18px ${accent}aa`,
        }}>NETWEBMEDIA</div>
        <div style={{
          fontSize: 92,
          color: '#fff',
          fontWeight: 900,
          lineHeight: 1.02,
          marginBottom: 48,
          fontFamily: 'Poppins, Inter, sans-serif',
          textShadow: '0 4px 18px rgba(0,0,0,0.7)',
        }}>{safe(text)}</div>
        <div style={{
          display: 'inline-block',
          padding: '26px 64px',
          borderRadius: 9999,
          background: accent,
          color: '#010F3B',
          fontSize: 46,
          fontWeight: 900,
          letterSpacing: 2,
          fontFamily: 'Inter, sans-serif',
          boxShadow: `0 0 48px ${accent}cc, 0 0 14px ${accent}`,
          transform: `scale(${0.85 + ctaPop * 0.15})`,
        }}>netwebmedia.com</div>
      </div>
    </AbsoluteFill>
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
  const { fps, durationInFrames } = useVideoConfig();

  const HOOK_END = Math.floor(fps * 2.0);
  const SUB_START = HOOK_END;
  const SUB_END = Math.floor(fps * 9.0);
  const CTA_START = SUB_END;
  const CTA_LEN = durationInFrames - CTA_START;

  const zoom = useSnapZoom();

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Base Higgsfield video — 1.5x playback + snap-zoom cuts for energy */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
        <Video
          src={staticFile(source)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted={false}
          volume={0.5}
          playbackRate={1.5}
        />
      </AbsoluteFill>

      {/* Vignette for overlay readability */}
      <AbsoluteFill style={{
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.65) 100%)',
        pointerEvents: 'none',
      }} />

      {/* HOOK 0–2s */}
      <Sequence from={0} durationInFrames={HOOK_END}>
        <Hook text={hook_text} accent={accent} />
      </Sequence>

      {/* Whip-flash on hook→sub (driven by the 2s snap-zoom cut) */}
      <Sequence from={HOOK_END - 2} durationInFrames={Math.floor(fps * 0.25)}>
        <FlashCut accent={accent} />
      </Sequence>

      {/* SUB 2–9s with mid-flash at 5.5s tied to the second snap-zoom */}
      <Sequence from={SUB_START} durationInFrames={SUB_END - SUB_START}>
        <Sub text={sub_text} accent={accent} />
      </Sequence>
      <Sequence from={Math.floor(fps * 5.5) - 2} durationInFrames={Math.floor(fps * 0.25)}>
        <FlashCut accent={accent} />
      </Sequence>

      {/* Whip-flash on sub→CTA */}
      <Sequence from={CTA_START - 2} durationInFrames={Math.floor(fps * 0.3)}>
        <FlashCut accent={accent} />
      </Sequence>

      {/* CTA 9–15s */}
      <Sequence from={CTA_START} durationInFrames={CTA_LEN}>
        <CTA text={cta_text} accent={accent} accentDark={accent_dark} />
      </Sequence>

      {/* Top handle ribbon during source-video portion only */}
      <Sequence from={0} durationInFrames={CTA_START}>
        <TopRibbon handle={handle} accent={accent} visible />
      </Sequence>

      {/* Progress bar full duration */}
      <ProgressBar accent={accent} />
    </AbsoluteFill>
  );
};

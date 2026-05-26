import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  BRAND,
  Beat,
  HANDLE,
  Reel,
  ReelTheme,
  TransitionKind,
  URL,
} from '../data/mvp-reels';

// ----------------------------------------------------------------------------
// Per-reel transitions. Each is a 12-frame overlay played between beats — the
// outgoing beat finishes, the transition fires, the incoming beat begins.
// All transitions stay inside the brand palette: navy bg, orange accent, plus
// the reel-specific tertiary color when it fits the motif.
// ----------------------------------------------------------------------------

const Transition: React.FC<{
  kind: TransitionKind;
  tertiary: string;
}> = ({ kind, tertiary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = frame / (fps * 0.4); // 0 → 1 across ~12 frames at 30fps

  switch (kind) {
    case 'zoom-punch': {
      const scale = 1 + 0.18 * Math.sin(p * Math.PI);
      const opacity = 1 - Math.abs(0.5 - p) * 2;
      return (
        <AbsoluteFill
          style={{
            background: BRAND.orange,
            opacity: opacity * 0.45,
            transform: `scale(${scale})`,
            mixBlendMode: 'overlay',
          }}
        />
      );
    }
    case 'light-flash': {
      const opacity = p < 0.5 ? p * 2 : (1 - p) * 2;
      return (
        <AbsoluteFill style={{ background: '#FFFFFF', opacity: opacity * 0.95 }} />
      );
    }
    case 'scale-zoom': {
      const scale = interpolate(p, [0, 1], [1.0, 1.18]);
      return (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, ${tertiary}55 0%, transparent 70%)`,
            transform: `scale(${scale})`,
          }}
        />
      );
    }
    case 'glitch-slide': {
      const x = interpolate(p, [0, 1], [-12, 12]);
      return (
        <AbsoluteFill>
          <AbsoluteFill
            style={{
              background: tertiary,
              opacity: 0.3,
              transform: `translateX(${x}px)`,
              mixBlendMode: 'screen',
            }}
          />
          <AbsoluteFill
            style={{
              background: BRAND.orange,
              opacity: 0.25,
              transform: `translateX(${-x}px)`,
              mixBlendMode: 'screen',
            }}
          />
        </AbsoluteFill>
      );
    }
    case 'matrix-wipe': {
      const cols = 12;
      return (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
          {Array.from({ length: cols }).map((_, i) => {
            const delay = i / cols;
            const local = Math.max(0, Math.min(1, (p - delay * 0.4) * 2));
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: i % 2 === 0 ? tertiary : BRAND.navy,
                  opacity: local < 0.5 ? local * 2 : (1 - local) * 2,
                }}
              />
            );
          })}
        </AbsoluteFill>
      );
    }
    case 'parallax-pan': {
      const x1 = interpolate(p, [0, 1], [0, -80]);
      const x2 = interpolate(p, [0, 1], [0, 80]);
      return (
        <AbsoluteFill>
          <AbsoluteFill
            style={{
              background: `linear-gradient(90deg, ${BRAND.navy}99 0%, transparent 60%)`,
              transform: `translateX(${x1}px)`,
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(270deg, ${tertiary}55 0%, transparent 60%)`,
              transform: `translateX(${x2}px)`,
            }}
          />
        </AbsoluteFill>
      );
    }
    case 'cinema-fade': {
      const opacity = p < 0.5 ? p * 2 : (1 - p) * 2;
      return <AbsoluteFill style={{ background: BRAND.navyDeep, opacity }} />;
    }
    case 'depth-stack': {
      return (
        <AbsoluteFill>
          {[0, 1, 2].map((i) => {
            const delay = i * 0.18;
            const local = Math.max(0, Math.min(1, (p - delay) * 2.5));
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: `${20 + i * 6}%`,
                  background: i === 1 ? BRAND.orange : tertiary,
                  opacity: (local < 0.5 ? local * 2 : (1 - local) * 2) * 0.6,
                  borderRadius: 18,
                  transform: `translateY(${(1 - local) * 30}px)`,
                  mixBlendMode: 'screen',
                }}
              />
            );
          })}
        </AbsoluteFill>
      );
    }
    case 'momentum-blur': {
      const x = interpolate(p, [0, 1], [-100, 100]);
      const blur = (1 - Math.abs(0.5 - p) * 2) * 18;
      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(90deg, transparent, ${BRAND.orange}, transparent)`,
            transform: `translateX(${x}%) skewX(-15deg)`,
            filter: `blur(${blur}px)`,
            opacity: 0.85,
            mixBlendMode: 'screen',
          }}
        />
      );
    }
    default:
      return null;
  }
};

// ----------------------------------------------------------------------------
// Caption with per-word emphasis. Words in `emphasis` render in tertiary
// (or orange when no tertiary is set). Style varies by caption_style.
// ----------------------------------------------------------------------------

const Caption: React.FC<{
  text: string;
  emphasis: string[];
  theme: ReelTheme;
}> = ({ text, emphasis, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 280, mass: 0.5 },
  });

  const fontSize =
    theme.caption_style === 'cinematic' ? 56 :
    theme.caption_style === 'tight' ? 44 :
    52;

  const family = theme.caption_style === 'cinematic'
    ? 'Poppins, Inter, sans-serif'
    : 'Inter, sans-serif';

  const renderText = () => {
    if (!emphasis.length) return text;
    let remaining = text;
    const out: React.ReactNode[] = [];
    let key = 0;
    while (remaining.length) {
      const match = emphasis
        .map((word) => ({ word, idx: remaining.toLowerCase().indexOf(word.toLowerCase()) }))
        .filter((m) => m.idx >= 0)
        .sort((a, b) => a.idx - b.idx)[0];
      if (!match) {
        out.push(<span key={key++}>{remaining}</span>);
        break;
      }
      if (match.idx > 0) out.push(<span key={key++}>{remaining.slice(0, match.idx)}</span>);
      out.push(
        <span
          key={key++}
          style={{
            color: theme.tertiary,
            background: `${BRAND.orange}22`,
            padding: '0 6px',
            borderRadius: 4,
            fontWeight: 900,
          }}
        >
          {remaining.slice(match.idx, match.idx + match.word.length)}
        </span>,
      );
      remaining = remaining.slice(match.idx + match.word.length);
    }
    return <>{out}</>;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        bottom: 220,
        textAlign: 'center',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px)`,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '20px 28px',
          background: 'rgba(1,15,59,0.82)',
          borderLeft: `8px solid ${BRAND.orange}`,
          borderRadius: 14,
          color: BRAND.white,
          fontSize,
          fontWeight: 800,
          lineHeight: 1.15,
          fontFamily: family,
          maxWidth: '94%',
          textShadow: '0 2px 10px rgba(0,0,0,0.85)',
          letterSpacing: theme.caption_style === 'cinematic' ? 0.5 : 0,
        }}
      >
        {renderText()}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Always-on layers: corner handle, watermark, hook overlay (first 2.5s),
// progress bar in tertiary accent.
// ----------------------------------------------------------------------------

const HandleSticker: React.FC<{ tertiary: string }> = ({ tertiary }) => (
  <div
    style={{
      position: 'absolute',
      top: 56,
      right: 40,
      padding: '10px 20px',
      borderRadius: 9999,
      background: 'rgba(1,15,59,0.7)',
      border: `2px solid ${tertiary}`,
      color: BRAND.white,
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: 1,
      fontFamily: 'Inter, sans-serif',
      textShadow: '0 2px 6px rgba(0,0,0,0.6)',
      zIndex: 6,
      pointerEvents: 'none',
    }}
  >
    {HANDLE}
  </div>
);

const Watermark: React.FC = () => (
  <img
    src={staticFile('nwm-logo.png')}
    style={{
      position: 'absolute',
      top: 60,
      left: 40,
      width: 72,
      height: 72,
      opacity: 0.72,
      zIndex: 6,
      pointerEvents: 'none',
    }}
    alt=""
  />
);

const HookOverlay: React.FC<{ hook: string; theme: ReelTheme }> = ({ hook, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 220, mass: 0.45 } });
  const exit = interpolate(frame, [fps * 2.1, fps * 2.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = enter * (1 - exit);
  return (
    <div
      style={{
        position: 'absolute',
        top: 200,
        left: 40,
        right: 40,
        textAlign: 'center',
        opacity,
        transform: `translateY(${(1 - enter) * -24}px) scale(${0.92 + enter * 0.08})`,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '18px 26px',
          background: BRAND.orange,
          color: BRAND.navy,
          fontSize: 64,
          fontWeight: 900,
          lineHeight: 1.05,
          fontFamily: 'Poppins, Inter, sans-serif',
          borderRadius: 12,
          letterSpacing: -0.5,
          boxShadow: `0 0 32px ${theme.tertiary}66, 0 6px 20px rgba(0,0,0,0.6)`,
          maxWidth: '94%',
        }}
      >
        {hook}
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ tertiary: string }> = ({ tertiary }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 8,
        background: 'rgba(255,255,255,0.15)',
        zIndex: 8,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${BRAND.orange} 0%, ${tertiary} 100%)`,
          boxShadow: `0 0 14px ${BRAND.orange}, 0 0 22px ${tertiary}66`,
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------------------
// End card — 2s, navy bg, horizontal logo, package-specific orange CTA strip.
// ----------------------------------------------------------------------------

const EndCard: React.FC<{ theme: ReelTheme; url: string }> = ({ theme, url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 240, mass: 0.5 } });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${theme.tertiary}22 0%, ${BRAND.navy} 65%)`,
      }}
    >
      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: '32%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
        }}
      >
        <img
          src={staticFile('nwm-logo-horizontal.png')}
          style={{ width: '62%', maxWidth: 680 }}
          alt=""
        />
      </div>

      {/* Package CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: '14%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '22px 36px',
            background: BRAND.orange,
            color: BRAND.navy,
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: 0.5,
            fontFamily: 'Poppins, Inter, sans-serif',
            borderRadius: 12,
            boxShadow: `0 0 32px ${theme.tertiary}55, 0 6px 20px rgba(0,0,0,0.5)`,
          }}
        >
          {theme.endCardCta}
        </div>
        <div
          style={{
            marginTop: 22,
            color: BRAND.textOnNavy,
            fontSize: 32,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: 1,
          }}
        >
          {url}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// Main composition. Renders all beats + transitions + always-on layers + music
// + end card.
// ----------------------------------------------------------------------------

export type MvpReelProps = {
  reel: Reel;
};

export const MvpReel: React.FC<MvpReelProps> = ({ reel }) => {
  const { fps } = useVideoConfig();
  const { beats, theme, hook, duration, package_url } = reel;
  const endCardStart = Math.floor(fps * (duration - 2));

  return (
    <AbsoluteFill style={{ background: BRAND.navy }}>
      {/* Beats */}
      {beats.map((beat, i) => {
        const fromFrame = Math.floor(beat.t_start * fps);
        const beatFrames = Math.floor((beat.t_end - beat.t_start) * fps);
        return (
          <Sequence
            key={`beat-${i}`}
            from={fromFrame}
            durationInFrames={beatFrames}
          >
            <BeatRenderer beat={beat} theme={theme} />
          </Sequence>
        );
      })}

      {/* Transitions between beats */}
      {beats.map((beat, i) => {
        if (!beat.transitionOut || i === beats.length - 1) return null;
        const startFrame = Math.floor(beat.t_end * fps) - 6;
        return (
          <Sequence
            key={`trans-${i}`}
            from={startFrame}
            durationInFrames={12}
          >
            <Transition kind={beat.transitionOut} tertiary={theme.tertiary} />
          </Sequence>
        );
      })}

      {/* Bottom-edge fade for caption legibility */}
      <Sequence from={0} durationInFrames={endCardStart}>
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(1,15,59,0.55) 88%, rgba(1,15,59,0.75) 100%)',
            pointerEvents: 'none',
          }}
        />
      </Sequence>

      {/* Hook overlay (0–2.6s) */}
      <Sequence from={0} durationInFrames={Math.floor(fps * 2.6)}>
        <HookOverlay hook={hook} theme={theme} />
      </Sequence>

      {/* Captions per beat (skipped for first beat — hook covers that beat) */}
      {beats.map((beat, i) => {
        if (!beat.caption || i === 0) return null;
        const fromFrame = Math.floor(beat.t_start * fps);
        const beatFrames = Math.floor((beat.t_end - beat.t_start) * fps);
        return (
          <Sequence
            key={`cap-${i}`}
            from={fromFrame}
            durationInFrames={beatFrames}
          >
            <Caption
              text={beat.caption}
              emphasis={beat.emphasis ?? []}
              theme={theme}
            />
          </Sequence>
        );
      })}

      {/* Always-on layers during beats (not on end card) */}
      <Sequence from={0} durationInFrames={endCardStart}>
        <HandleSticker tertiary={theme.tertiary} />
        <Watermark />
        <ProgressBar tertiary={theme.tertiary} />
      </Sequence>

      {/* End card (last 2s) */}
      <Sequence from={endCardStart} durationInFrames={Math.floor(fps * 2)}>
        <EndCard theme={theme} url={package_url} />
      </Sequence>

      {/* Music bed — full reel including end card. Source clips' ambient audio
          stays at 0.6, music at 0.45. */}
      <Audio src={staticFile(`music/${theme.music}`)} volume={0.45} />
    </AbsoluteFill>
  );
};

const BeatRenderer: React.FC<{ beat: Beat; theme: ReelTheme }> = ({ beat, theme }) => {
  return (
    <AbsoluteFill>
      <Video
        src={staticFile(`clips/${beat.clip}`)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        volume={0.6}
        muted={false}
      />
      {/* Subtle color grade — warm tint over hero/b-roll for brand cohesion */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.tertiary}11 0%, transparent 40%, ${BRAND.navy}22 100%)`,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

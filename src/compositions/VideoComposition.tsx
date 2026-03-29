import React from "react";
import {
  AbsoluteFill,
  Series,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import type { ShortsScript, SceneConfig, TextBlock, SlideDirection } from "../types";

// ── Shake effect ──
function useShake(frame: number, active: boolean, intensity = 10) {
  if (!active) return { x: 0, y: 0 };
  const x = Math.sin(frame * 13.7) * intensity * Math.cos(frame * 7.3);
  const y = Math.cos(frame * 17.3) * intensity * 0.6 * Math.sin(frame * 11.1);
  return { x, y };
}

// ── Slide animation with motion blur ──
function useSlideIn(
  frame: number,
  fps: number,
  direction: SlideDirection,
  startFrame: number,
  screenW: number,
  screenH: number
) {
  const adjustedFrame = Math.max(0, frame - startFrame);
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.7 },
  });

  const offsets: Record<SlideDirection, { x: number; y: number }> = {
    left: { x: -screenW * 0.5, y: 0 },
    right: { x: screenW * 0.5, y: 0 },
    top: { x: 0, y: -screenH * 0.3 },
    bottom: { x: 0, y: screenH * 0.3 },
  };

  const off = offsets[direction];
  const x = interpolate(progress, [0, 1], [off.x, 0]);
  const y = interpolate(progress, [0, 1], [off.y, 0]);
  const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);
  const blur = interpolate(progress, [0, 0.5, 1], [6, 1, 0], {
    extrapolateRight: "clamp",
  });

  return { x, y, opacity, blur };
}

// ── Scale pop-in ──
function useScaleIn(frame: number, fps: number, startFrame: number) {
  const adjustedFrame = Math.max(0, frame - startFrame);
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 9, stiffness: 200, mass: 0.5 },
  });
  const scale = interpolate(progress, [0, 0.5, 0.75, 1], [0.2, 1.18, 0.93, 1]);
  const opacity = interpolate(progress, [0, 0.15, 1], [0, 1, 1]);
  return { scale, opacity };
}

// ── Typing effect ──
function useTyping(text: string, frame: number, startFrame: number) {
  const adjustedFrame = Math.max(0, frame - startFrame);
  const visibleChars = Math.min(text.length, Math.floor(adjustedFrame * 0.7));
  const cursor = adjustedFrame % 12 < 7 && visibleChars < text.length;
  return text.slice(0, visibleChars) + (cursor ? "▌" : "");
}

// ── Char-by-char ──
const CharByChar: React.FC<{
  text: string;
  frame: number;
  fps: number;
  startFrame: number;
  style: React.CSSProperties;
}> = ({ text, frame, fps, startFrame, style }) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", ...style }}>
      {text.split("").map((char, i) => {
        const charStart = startFrame + i * 2;
        const adj = Math.max(0, frame - charStart);
        const progress = spring({
          frame: adj,
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.4 },
        });
        const y = interpolate(progress, [0, 1], [30, 0]);
        const opacity = interpolate(progress, [0, 0.4, 1], [0, 1, 1]);
        const scale = interpolate(progress, [0, 0.6, 1], [0.6, 1.08, 1]);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${y}px) scale(${scale})`,
              opacity,
              whiteSpace: char === " " ? "pre" : undefined,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </div>
  );
};

// ── Single text block renderer ──
const TextBlockRenderer: React.FC<{
  block: TextBlock;
  frame: number;
  fps: number;
  width: number;
  height: number;
}> = ({ block, frame, fps, width, height }) => {
  const {
    text,
    effect,
    direction = "bottom",
    fontSize = 68,
    color = "#FFFFFF",
    highlight = false,
    startFrame,
    bold = true,
  } = block;

  // Don't render if not yet started
  if (frame < startFrame - 2) return null;

  const scaledFontSize = (fontSize / 1080) * width;

  const baseStyle: React.CSSProperties = {
    fontSize: scaledFontSize,
    fontWeight: bold ? 900 : 600,
    fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    color,
    textShadow: highlight
      ? `0 0 40px ${color}60, 0 0 80px ${color}30, 0 4px 12px rgba(0,0,0,0.9)`
      : "0 3px 10px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
    lineHeight: 1.35,
    letterSpacing: "-0.01em",
    textAlign: "center" as const,
    wordBreak: "keep-all" as const,
    maxWidth: width * 0.85,
  };

  if (effect === "typing") {
    const displayText = useTyping(text, frame, startFrame);
    return <div style={baseStyle}>{displayText}</div>;
  }

  if (effect === "charByChar") {
    return (
      <CharByChar text={text} frame={frame} fps={fps} startFrame={startFrame} style={baseStyle} />
    );
  }

  if (effect === "scale") {
    const { scale, opacity } = useScaleIn(frame, fps, startFrame);
    return (
      <div style={{ ...baseStyle, transform: `scale(${scale})`, opacity }}>
        {text}
      </div>
    );
  }

  if (effect === "shake") {
    const { scale, opacity } = useScaleIn(frame, fps, startFrame);
    const shakeActive = frame >= startFrame + 10 && frame <= startFrame + 22;
    const shake = useShake(frame, shakeActive, 8);
    return (
      <div
        style={{
          ...baseStyle,
          transform: `scale(${scale}) translate(${shake.x}px, ${shake.y}px)`,
          opacity,
        }}
      >
        {text}
      </div>
    );
  }

  if (effect === "fadeIn") {
    const adj = Math.max(0, frame - startFrame);
    const opacity = interpolate(adj, [0, 12], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    return <div style={{ ...baseStyle, opacity }}>{text}</div>;
  }

  // Default: slide
  const { x, y, opacity, blur } = useSlideIn(frame, fps, direction, startFrame, width, height);
  return (
    <div
      style={{
        ...baseStyle,
        transform: `translate(${x}px, ${y}px)`,
        opacity,
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
      }}
    >
      {text}
    </div>
  );
};

// ── Scene ──
const SceneRenderer: React.FC<{ scene: SceneConfig }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { transition, shake: shakeScene } = scene;

  // Zoom transition
  let sceneZoom = 1;
  if (transition === "zoomIn") {
    sceneZoom = interpolate(frame, [0, 10], [1.12, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  } else if (transition === "zoomOut") {
    sceneZoom = interpolate(frame, [0, 10], [0.88, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }

  // Flash overlay
  const flashOpacity =
    transition === "flash"
      ? interpolate(frame, [0, 3, 8], [0.7, 0.2, 0], { extrapolateRight: "clamp" })
      : 0;

  // Scene shake
  const sceneShake = useShake(frame, shakeScene || false, 6);

  // Exit fade (last 8 frames)
  const exitOpacity = interpolate(
    frame,
    [scene.durationInFrames - 8, scene.durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: scene.backgroundColor, overflow: "hidden" }}>
      {/* Audio for this scene */}
      <Audio src={staticFile(scene.audioFile)} volume={1} />

      {/* Content area - positioned in upper-center (avoiding bottom 30% for shorts UI) */}
      <AbsoluteFill
        style={{
          transform: `scale(${sceneZoom}) translate(${sceneShake.x}px, ${sceneShake.y}px)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          // Top 10% to 65% of screen = safe area for shorts
          paddingTop: height * 0.15,
          paddingBottom: height * 0.35,
          paddingLeft: width * 0.06,
          paddingRight: width * 0.06,
          opacity: exitOpacity,
          gap: height * 0.02,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: height * 0.015,
            flex: 1,
          }}
        >
          {scene.blocks.map((block, i) => (
            <TextBlockRenderer
              key={i}
              block={block}
              frame={frame}
              fps={fps}
              width={width}
              height={height}
            />
          ))}
        </div>
      </AbsoluteFill>

      {/* Flash overlay */}
      {flashOpacity > 0 && (
        <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flashOpacity})` }} />
      )}
    </AbsoluteFill>
  );
};

// ── Main composition ──
export const VideoComposition: React.FC<ShortsScript> = ({ scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Series>
        {scenes.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
            <SceneRenderer scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

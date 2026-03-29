import React from "react";
import {
  AbsoluteFill,
  Series,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import type {
  ShortsScript,
  SceneConfig,
  TextLine,
  SlideDirection,
} from "../types";

// ── Motion Blur wrapper ──
const MotionBlur: React.FC<{
  children: React.ReactNode;
  intensity: number;
}> = ({ children, intensity }) => {
  return (
    <div style={{ filter: `blur(${intensity}px)` }}>
      {children}
    </div>
  );
};

// ── Shake effect ──
function useShake(frame: number, active: boolean) {
  if (!active) return { x: 0, y: 0 };
  const seed = Math.sin(frame * 13.7) * 43758.5453;
  const x = (seed - Math.floor(seed) - 0.5) * 12;
  const seed2 = Math.sin(frame * 17.3) * 23421.631;
  const y = (seed2 - Math.floor(seed2) - 0.5) * 8;
  return { x, y };
}

// ── Slide animation ──
function useSlideIn(
  frame: number,
  fps: number,
  direction: SlideDirection,
  delay: number,
  screenW: number,
  screenH: number
) {
  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  // Motion blur based on velocity
  const prevProgress = spring({
    frame: Math.max(0, adjustedFrame - 1),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const velocity = Math.abs(progress - prevProgress);
  const blur = interpolate(velocity, [0, 0.1], [0, 4], {
    extrapolateRight: "clamp",
  });

  const offsets: Record<SlideDirection, { x: number; y: number }> = {
    left: { x: -screenW * 0.6, y: 0 },
    right: { x: screenW * 0.6, y: 0 },
    top: { x: 0, y: -screenH * 0.4 },
    bottom: { x: 0, y: screenH * 0.4 },
  };

  const off = offsets[direction];
  const x = interpolate(progress, [0, 1], [off.x, 0]);
  const y = interpolate(progress, [0, 1], [off.y, 0]);
  const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

  return { x, y, opacity, blur };
}

// ── Scale emphasis ──
function useScaleIn(frame: number, fps: number, delay: number) {
  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.6 },
  });

  const scale = interpolate(progress, [0, 0.6, 0.8, 1], [0.3, 1.15, 0.95, 1]);
  const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 1]);

  return { scale, opacity };
}

// ── Typing effect ──
function useTyping(
  text: string,
  frame: number,
  delay: number,
  charsPerFrame: number = 0.6
) {
  const adjustedFrame = Math.max(0, frame - delay);
  const visibleChars = Math.min(
    text.length,
    Math.floor(adjustedFrame * charsPerFrame)
  );
  const displayText = text.slice(0, visibleChars);
  const showCursor = adjustedFrame % 10 < 6 && visibleChars < text.length;
  return displayText + (showCursor ? "▌" : "");
}

// ── Char-by-char effect ──
const CharByChar: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay: number;
  style: React.CSSProperties;
}> = ({ text, frame, fps, delay, style }) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "inherit", ...style }}>
      {text.split("").map((char, i) => {
        const charDelay = delay + i * 2;
        const adjustedFrame = Math.max(0, frame - charDelay);
        const progress = spring({
          frame: adjustedFrame,
          fps,
          config: { damping: 12, stiffness: 180, mass: 0.5 },
        });
        const y = interpolate(progress, [0, 1], [40, 0]);
        const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 1]);
        const scale = interpolate(progress, [0, 0.7, 1], [0.5, 1.1, 1]);

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

// ── Single text line renderer ──
const TextLineRenderer: React.FC<{
  line: TextLine;
  frame: number;
  fps: number;
  width: number;
  height: number;
}> = ({ line, frame, fps, width, height }) => {
  const {
    text,
    effect,
    direction = "bottom",
    fontSize = 72,
    color = "#FFFFFF",
    highlight = false,
    delay = 0,
    bold = true,
  } = line;

  const scaledFontSize = (fontSize / 1080) * width;

  const baseStyle: React.CSSProperties = {
    fontSize: scaledFontSize,
    fontWeight: bold ? 900 : 700,
    fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    color,
    textShadow: highlight
      ? `0 0 30px ${color}80, 0 0 60px ${color}40, 0 4px 8px rgba(0,0,0,0.8)`
      : "0 4px 12px rgba(0,0,0,0.7)",
    lineHeight: 1.3,
    letterSpacing: bold ? "-0.02em" : "0",
    WebkitTextStroke: highlight ? "1px rgba(255,255,255,0.1)" : undefined,
  };

  if (effect === "typing") {
    const displayText = useTyping(text, frame, delay);
    return <div style={baseStyle}>{displayText}</div>;
  }

  if (effect === "charByChar") {
    return (
      <CharByChar
        text={text}
        frame={frame}
        fps={fps}
        delay={delay}
        style={baseStyle}
      />
    );
  }

  if (effect === "scale") {
    const { scale, opacity } = useScaleIn(frame, fps, delay);
    return (
      <div
        style={{
          ...baseStyle,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {text}
      </div>
    );
  }

  if (effect === "shake") {
    const { scale, opacity } = useScaleIn(frame, fps, delay);
    const shakeActive = frame > delay + 8 && frame < delay + 20;
    const shake = useShake(frame, shakeActive);
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

  // Default: slide
  const { x, y, opacity, blur } = useSlideIn(
    frame,
    fps,
    direction,
    delay,
    width,
    height
  );

  return (
    <MotionBlur intensity={blur}>
      <div
        style={{
          ...baseStyle,
          transform: `translate(${x}px, ${y}px)`,
          opacity,
        }}
      >
        {text}
      </div>
    </MotionBlur>
  );
};

// ── Scene component ──
const SceneRenderer: React.FC<{ scene: SceneConfig }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const { position, transition, shake: shakeScene, zoom = 1 } = scene;

  // Scene-level zoom transition
  let sceneZoom = zoom;
  if (transition === "zoomIn") {
    const zoomProgress = interpolate(frame, [0, 8], [1.15, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    sceneZoom = zoom * zoomProgress;
  } else if (transition === "zoomOut") {
    const zoomProgress = interpolate(frame, [0, 8], [0.85, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    sceneZoom = zoom * zoomProgress;
  }

  // Flash transition (white overlay that fades)
  const flashOpacity =
    transition === "flash"
      ? interpolate(frame, [0, 4, 10], [0.8, 0.3, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  // Scene-level shake
  const sceneShake = useShake(frame, shakeScene || false);

  // Exit fade (last 5 frames)
  const exitOpacity = interpolate(
    frame,
    [scene.durationInFrames - 5, scene.durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Positioning
  const justifyMap = {
    top: "flex-start",
    upper: "flex-start",
    center: "center",
    lower: "flex-end",
    bottom: "flex-end",
  } as const;

  const paddingMap = {
    top: { paddingTop: height * 0.12 },
    upper: { paddingTop: height * 0.25 },
    center: {},
    lower: { paddingBottom: height * 0.25 },
    bottom: { paddingBottom: height * 0.12 },
  } as const;

  const textAlignMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  } as const;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.backgroundColor,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${sceneZoom}) translate(${sceneShake.x}px, ${sceneShake.y}px)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: justifyMap[position.vertical],
          alignItems: textAlignMap[position.horizontal],
          padding: `0 ${width * 0.08}px`,
          opacity: exitOpacity,
          gap: 12,
          ...paddingMap[position.vertical],
        }}
      >
        {scene.lines.map((line, i) => (
          <TextLineRenderer
            key={i}
            line={line}
            frame={frame}
            fps={fps}
            width={width}
            height={height}
          />
        ))}
      </AbsoluteFill>

      {/* Flash overlay */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(255,255,255,${flashOpacity})`,
          }}
        />
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
          <Series.Sequence
            key={scene.id}
            durationInFrames={scene.durationInFrames}
          >
            <SceneRenderer scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

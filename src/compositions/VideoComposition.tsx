import React from "react";
import {
  AbsoluteFill,
  Series,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { VideoScript } from "../types";

const SceneComponent: React.FC<{
  title: string;
  text: string;
  backgroundColor: string;
  textColor: string;
}> = ({ title, text, backgroundColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Title fade-in
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Title slide down
  const titleY = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const titleTranslateY = interpolate(titleY, [0, 1], [-40, 0]);

  // Body text slide up
  const textProgress = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const textTranslateY = interpolate(textProgress, [0, 1], [50, 0]);
  const textOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: width * 0.05,
      }}
    >
      <div
        style={{
          color: textColor,
          fontSize: width * 0.04,
          fontWeight: 700,
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
          marginBottom: 40,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: textColor,
          fontSize: width * 0.022,
          fontWeight: 400,
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: width * 0.7,
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<VideoScript> = ({ title, scenes }) => {
  return (
    <AbsoluteFill>
      <Series>
        {scenes.map((scene) => (
          <Series.Sequence
            key={scene.id}
            durationInFrames={scene.durationInFrames}
          >
            <SceneComponent
              title={scene.title}
              text={scene.text}
              backgroundColor={scene.backgroundColor}
              textColor={scene.textColor}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

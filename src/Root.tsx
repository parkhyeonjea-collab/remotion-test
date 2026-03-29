import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { ShortsScript } from "./types";

const fallbackScript: ShortsScript = {
  title: "Sample",
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      id: 1,
      durationInFrames: 90,
      backgroundColor: "#0a0a0a",
      audioFile: "audio/scene_1.wav",
      blocks: [
        {
          text: "스크립트를 먼저 생성하세요",
          effect: "scale",
          fontSize: 72,
          color: "#FFFFFF",
          startFrame: 0,
          bold: true,
        },
      ],
    },
  ],
};

let videoScript: ShortsScript;
try {
  videoScript = require("../video-script.json") as ShortsScript;
} catch {
  videoScript = fallbackScript;
}

const totalDuration = videoScript.scenes.reduce(
  (sum, scene) => sum + scene.durationInFrames,
  0
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={totalDuration}
        fps={videoScript.fps}
        width={videoScript.width}
        height={videoScript.height}
        defaultProps={videoScript}
      />
    </>
  );
};

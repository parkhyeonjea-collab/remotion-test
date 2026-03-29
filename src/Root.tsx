import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { ShortsScript } from "./types";

const fallbackScript: ShortsScript = {
  title: "Sample Shorts",
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      id: 1,
      durationInFrames: 60,
      backgroundColor: "#0a0a0a",
      position: { horizontal: "center", vertical: "center" },
      lines: [
        {
          text: "Run npm run generate first",
          effect: "scale",
          fontSize: 72,
          color: "#FFFFFF",
          delay: 0,
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

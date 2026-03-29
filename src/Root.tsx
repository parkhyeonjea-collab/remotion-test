import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { VideoScript } from "./types";

// Fallback script for when video-script.json doesn't exist yet
const fallbackScript: VideoScript = {
  title: "Sample Video",
  fps: 30,
  width: 1920,
  height: 1080,
  scenes: [
    {
      id: 1,
      title: "Qwen3 + Remotion",
      text: "Run 'npm run generate' to create a video script with Qwen3 AI",
      backgroundColor: "#1a1a2e",
      textColor: "#e94560",
      durationInFrames: 120,
    },
    {
      id: 2,
      title: "How it works",
      text: "Qwen3 generates structured scene data, and Remotion renders it into a video",
      backgroundColor: "#16213e",
      textColor: "#0f3460",
      durationInFrames: 120,
    },
  ],
};

let videoScript: VideoScript;
try {
  videoScript = require("../video-script.json") as VideoScript;
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

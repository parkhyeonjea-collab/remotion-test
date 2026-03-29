export type SlideDirection = "top" | "bottom" | "left" | "right";
export type TextEffect = "slide" | "scale" | "typing" | "charByChar" | "shake" | "fadeIn";
export type TextAlign = "left" | "center" | "right";

export interface TextBlock {
  text: string;
  effect: TextEffect;
  direction?: SlideDirection;
  fontSize?: number;
  color?: string;
  highlight?: boolean;
  startFrame: number; // when this text appears
  bold?: boolean;
}

export interface SceneConfig {
  id: number;
  blocks: TextBlock[];
  durationInFrames: number;
  backgroundColor: string;
  audioFile: string;
  transition?: "zoomIn" | "zoomOut" | "flash" | "cut";
  shake?: boolean;
}

export interface ShortsScript {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: SceneConfig[];
}

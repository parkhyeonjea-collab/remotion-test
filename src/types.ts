export type SlideDirection = "top" | "bottom" | "left" | "right";
export type TextEffect = "slide" | "scale" | "typing" | "charByChar" | "shake";
export type TextAlign = "left" | "center" | "right";
export type VerticalPosition = "top" | "center" | "bottom" | "upper" | "lower";

export interface TextLine {
  text: string;
  effect: TextEffect;
  direction?: SlideDirection;
  fontSize?: number;
  color?: string;
  highlight?: boolean; // keyword emphasis
  delay?: number; // frames delay within scene
  bold?: boolean;
}

export interface SceneConfig {
  id: number;
  lines: TextLine[];
  durationInFrames: number;
  backgroundColor: string;
  position: {
    horizontal: TextAlign;
    vertical: VerticalPosition;
  };
  transition?: "zoomIn" | "zoomOut" | "cut" | "flash";
  shake?: boolean;
  zoom?: number; // base zoom level 1.0
}

export interface ShortsScript {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: SceneConfig[];
}

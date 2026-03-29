export interface Scene {
  id: number;
  title: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  durationInFrames: number;
}

export interface VideoScript {
  title: string;
  scenes: Scene[];
  fps: number;
  width: number;
  height: number;
}

import videojs from 'video.js';

declare module 'video.js' {
  export interface VideoJsPlayer {
    qualityLevels(): QualityLevelList;
  }
}

export interface QualityLevel {
  enabled: boolean;
  height: number;
  width: number;
  bitrate: number;
  id: string;
}

export interface QualityLevelList {
  length: number;
  selectedIndex: number;
  [index: number]: QualityLevel;
  on(event: string, callback: () => void): void;
  off(event: string, callback: () => void): void;
}

declare module 'videojs-contrib-quality-levels' {
  const plugin: (options?: any) => void;
  export default plugin;
}

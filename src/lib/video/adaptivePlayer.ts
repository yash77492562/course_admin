/**
 * Adaptive video player that handles seamless quality switching
 * Switches quality without restarting video from beginning
 */

export interface VideoQuality {
  quality: string;
  url: string;
  width: number;
  height: number;
}

export interface PlayerState {
  currentQuality: string;
  currentTime: number;
  isPlaying: boolean;
  availableQualities: string[];
}

export class AdaptiveVideoPlayer {
  private videoElement: HTMLVideoElement;
  private qualities: Map<string, VideoQuality> = new Map();
  private currentQuality: string = '';
  private switchingQuality: boolean = false;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }

  /**
   * Initialize player with available qualities
   */
  setQualities(qualities: VideoQuality[]): void {
    this.qualities.clear();
    qualities.forEach((quality) => {
      this.qualities.set(quality.quality, quality);
    });

    // Set initial quality (lowest by default)
    if (qualities.length > 0) {
      const sortedQualities = this.getSortedQualities();
      this.setQuality(sortedQualities[0]);
    }
  }

  /**
   * Get available qualities sorted by resolution
   */
  getSortedQualities(): string[] {
    const qualityOrder: Record<string, number> = {
      '460p': 1,
      '720p': 2,
      '1080p': 3,
      'original': 4,
    };

    return Array.from(this.qualities.keys()).sort((a, b) => {
      return (qualityOrder[a] || 0) - (qualityOrder[b] || 0);
    });
  }

  /**
   * Switch to a different quality without restarting video
   */
  async switchQuality(newQuality: string): Promise<void> {
    if (this.switchingQuality) {
      console.warn('Quality switch already in progress');
      return;
    }

    if (!this.qualities.has(newQuality)) {
      console.error(`Quality ${newQuality} not available`);
      return;
    }

    if (newQuality === this.currentQuality) {
      return;
    }

    this.switchingQuality = true;

    try {
      // Save current state
      const currentTime = this.videoElement.currentTime;
      const wasPlaying = !this.videoElement.paused;

      // Switch source
      const quality = this.qualities.get(newQuality)!;
      this.videoElement.src = quality.url;

      // Wait for new video to load
      await new Promise<void>((resolve, reject) => {
        const onLoadedMetadata = () => {
          this.videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
          this.videoElement.removeEventListener('error', onError);
          resolve();
        };

        const onError = () => {
          this.videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
          this.videoElement.removeEventListener('error', onError);
          reject(new Error('Failed to load video'));
        };

        this.videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        this.videoElement.addEventListener('error', onError);
      });

      // Restore playback position
      this.videoElement.currentTime = currentTime;

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          this.videoElement.removeEventListener('seeked', onSeeked);
          resolve();
        };
        this.videoElement.addEventListener('seeked', onSeeked);
      });

      // Resume playback if it was playing
      if (wasPlaying) {
        await this.videoElement.play();
      }

      this.currentQuality = newQuality;
      console.log(`Switched to ${newQuality} at ${currentTime}s`);
    } catch (error) {
      console.error('Failed to switch quality:', error);
      throw error;
    } finally {
      this.switchingQuality = false;
    }
  }

  /**
   * Set initial quality
   */
  private setQuality(quality: string): void {
    if (!this.qualities.has(quality)) {
      return;
    }

    const qualityData = this.qualities.get(quality)!;
    this.videoElement.src = qualityData.url;
    this.currentQuality = quality;
  }

  /**
   * Get current player state
   */
  getState(): PlayerState {
    return {
      currentQuality: this.currentQuality,
      currentTime: this.videoElement.currentTime,
      isPlaying: !this.videoElement.paused,
      availableQualities: this.getSortedQualities(),
    };
  }

  /**
   * Auto-select quality based on network conditions
   */
  async autoSelectQuality(): Promise<void> {
    // Simple implementation: check connection speed
    const connection = (navigator as any).connection;
    
    if (!connection) {
      // Default to medium quality if no connection info
      const qualities = this.getSortedQualities();
      const midQuality = qualities[Math.floor(qualities.length / 2)];
      await this.switchQuality(midQuality);
      return;
    }

    const effectiveType = connection.effectiveType;
    let targetQuality: string;

    switch (effectiveType) {
      case '4g':
        targetQuality = '1080p';
        break;
      case '3g':
        targetQuality = '720p';
        break;
      case '2g':
      case 'slow-2g':
        targetQuality = '460p';
        break;
      default:
        targetQuality = '720p';
    }

    // Find closest available quality
    const qualities = this.getSortedQualities();
    const available = qualities.includes(targetQuality)
      ? targetQuality
      : qualities[Math.floor(qualities.length / 2)];

    await this.switchQuality(available);
  }

  /**
   * Preload next quality for smooth switching
   */
  preloadQuality(quality: string): void {
    if (!this.qualities.has(quality)) {
      return;
    }

    const qualityData = this.qualities.get(quality)!;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = qualityData.url;
    document.head.appendChild(link);
  }

  /**
   * Get current quality
   */
  getCurrentQuality(): string {
    return this.currentQuality;
  }

  /**
   * Check if quality switching is in progress
   */
  isSwitching(): boolean {
    return this.switchingQuality;
  }
}

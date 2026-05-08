'use client';

import { HLSVideoPlayer } from './HLSVideoPlayer';
import { YouTubePlayer } from './YouTubePlayer';

interface VideoPlayerWrapperProps {
  videoType?: 'UPLOAD' | 'YOUTUBE';
  // HLS/Upload video props
  hlsMasterPlaylist?: string;
  hlsQualities?: Record<string, string>;
  videoUrls?: Record<string, string>;
  // YouTube video props
  videoUrl?: string;
  // Common props
  thumbnail?: string;
  title: string;
  autoplay?: boolean;
  videoDuration?: number; // Duration in seconds from database
  className?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function VideoPlayerWrapper({
  videoType = 'UPLOAD',
  hlsMasterPlaylist,
  hlsQualities,
  videoUrls,
  videoUrl,
  thumbnail,
  title,
  autoplay = false,
  videoDuration,
  className = '',
  onNext,
  onPrevious
}: VideoPlayerWrapperProps) {
  // Route to appropriate player based on video type
  if (videoType === 'YOUTUBE' && videoUrl) {
    return (
      <YouTubePlayer
        videoUrl={videoUrl}
        title={title}
        className={className}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  }

  // Default to HLS player for uploaded videos
  return (
    <HLSVideoPlayer
      hlsMasterPlaylist={hlsMasterPlaylist}
      hlsQualities={hlsQualities}
      videoUrls={videoUrls}
      thumbnail={thumbnail}
      title={title}
      autoplay={autoplay}
      videoDuration={videoDuration}
      className={className}
      onNext={onNext}
      onPrevious={onPrevious}
    />
  );
}

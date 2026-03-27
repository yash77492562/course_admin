'use client';

import { useState, useRef, useEffect } from 'react';

interface VideoQualityOption {
  quality: string;
  url: string;
  label: string;
}

interface CustomVideoPlayerProps {
  videoUrls: Record<string, string>; // { "420p": "url", "720p": "url", "1080p": "url" }
  thumbnail?: string;
  title: string;
  autoplay?: boolean;
  className?: string;
}

export function CustomVideoPlayer({ 
  videoUrls, 
  thumbnail, 
  title, 
  autoplay = false,
  className = '' 
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Available qualities based on provided URLs
  const availableQualities: VideoQualityOption[] = [
    { quality: 'auto', url: '', label: 'Auto' },
    ...Object.entries(videoUrls)
      .sort(([a], [b]) => {
        const order = { '1080p': 3, '720p': 2, '420p': 1 };
        return (order[b as keyof typeof order] || 0) - (order[a as keyof typeof order] || 0);
      })
      .map(([quality, url]) => ({
        quality,
        url,
        label: quality.toUpperCase()
      }))
  ];

  // Auto-select best quality on load
  useEffect(() => {
    if (availableQualities.length > 1) {
      const bestQuality = availableQualities[1]; // Skip 'auto', get highest quality
      setCurrentQuality(bestQuality.quality);
    }
  }, [videoUrls]);

  // Speed options
  const speedOptions = [
    { speed: 0.25, label: '0.25x' },
    { speed: 0.5, label: '0.5x' },
    { speed: 0.75, label: '0.75x' },
    { speed: 1, label: 'Normal' },
    { speed: 1.25, label: '1.25x' },
    { speed: 1.5, label: '1.5x' },
    { speed: 1.75, label: '1.75x' },
    { speed: 2, label: '2x' }
  ];

  const getCurrentVideoUrl = () => {
    if (currentQuality === 'auto') {
      // Auto quality logic - select based on connection/screen size
      if (availableQualities.length > 1) {
        return availableQualities[1].url; // Default to highest available
      }
    }
    return videoUrls[currentQuality] || Object.values(videoUrls)[0];
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changeQuality = (quality: string) => {
    if (!videoRef.current) return;
    
    const currentTimeBackup = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;
    
    setIsLoading(true);
    setCurrentQuality(quality);
    
    // Change video source
    videoRef.current.src = quality === 'auto' ? Object.values(videoUrls)[0] : videoUrls[quality];
    
    videoRef.current.addEventListener('loadeddata', () => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = currentTimeBackup;
      if (wasPlaying) {
        videoRef.current.play();
      }
      setIsLoading(false);
    }, { once: true });
    
    setShowQualityMenu(false);
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleWaiting = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={getCurrentVideoUrl()}
        poster={thumbnail}
        autoPlay={autoplay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-gray-300">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="text-white hover:text-gray-300">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Time */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Speed Control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white hover:text-gray-300 text-sm px-2 py-1 bg-black bg-opacity-50 rounded"
              >
                {speedOptions.find(s => s.speed === playbackSpeed)?.label || '1x'}
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg py-2 min-w-20">
                  {speedOptions.map((option) => (
                    <button
                      key={option.speed}
                      onClick={() => changeSpeed(option.speed)}
                      className={`block w-full text-left px-3 py-1 text-sm hover:bg-gray-700 ${
                        playbackSpeed === option.speed ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Control */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="text-white hover:text-gray-300 text-sm px-2 py-1 bg-black bg-opacity-50 rounded"
              >
                {availableQualities.find(q => q.quality === currentQuality)?.label || 'Auto'}
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg py-2 min-w-20">
                  {availableQualities.map((quality) => (
                    <button
                      key={quality.quality}
                      onClick={() => changeQuality(quality.quality)}
                      className={`block w-full text-left px-3 py-1 text-sm hover:bg-gray-700 ${
                        currentQuality === quality.quality ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      {quality.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
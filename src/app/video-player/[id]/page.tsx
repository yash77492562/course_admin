'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function VideoPlayerPage() {
  const params = useParams();
  const videoId = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const response = await fetch(`/api/lessons/${videoId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const lesson = result.data;
          setVideoData(lesson);
          
          // Get available qualities
          if (lesson.videoUrls) {
            const qualities = Object.keys(lesson.videoUrls);
            setAvailableQualities(['auto', ...qualities]);
            // Auto selects 720p by default, or best available
            setCurrentQuality('auto');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load video:', error);
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  // Get video URL based on selected quality
  const getVideoUrl = () => {
    if (!videoData) return '';
    
    if (videoData.videoType === 'YOUTUBE') {
      return videoData.videoUrl;
    }
    
    if (!videoData.videoUrls) return '';
    
    if (currentQuality === 'auto') {
      // Auto: prefer 720p, then 1080p, then 420p
      return videoData.videoUrls['720p'] || videoData.videoUrls['1080p'] || videoData.videoUrls['420p'] || Object.values(videoData.videoUrls)[0];
    }
    
    return videoData.videoUrls[currentQuality];
  };

  // Change quality
  const changeQuality = (quality: string) => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const wasPaused = videoRef.current.paused;
    
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    
    // After video loads new source, restore position
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (!wasPaused) {
          videoRef.current.play();
        }
      }
    }, 100);
  };

  // Change playback speed
  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const speedOptions = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: 'Normal' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 1.75, label: '1.75x' },
    { value: 2, label: '2x' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">Video not available</div>
      </div>
    );
  }

  const isYouTube = videoData.videoType === 'YOUTUBE';
  const videoUrl = getVideoUrl();

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
      videoId = url.split('/embed/')[1].split('?')[0];
    }
    
    return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&fs=1`;
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto">
        {/* Video Container */}
        <div className="w-full max-w-6xl mx-auto relative">
          <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
            {isYouTube ? (
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
              />
            ) : (
              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                className="absolute top-0 left-0 w-full h-full"
                controls
                autoPlay={false}
                style={{ backgroundColor: '#000' }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Custom Controls Overlay (only for uploaded videos) */}
          {!isYouTube && (
            <div className="absolute bottom-20 right-4 flex gap-2 z-10">
              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                  }}
                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-2 rounded text-sm font-medium transition-all"
                >
                  {currentQuality === 'auto' ? 'Auto' : currentQuality.toUpperCase()}
                </button>
                
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-95 rounded-lg py-2 min-w-[100px] shadow-lg">
                    {availableQualities.map((quality) => (
                      <button
                        key={quality}
                        onClick={() => changeQuality(quality)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-white hover:bg-opacity-10 transition-colors ${
                          currentQuality === quality ? 'text-blue-400 font-bold' : 'text-white'
                        }`}
                      >
                        {quality === 'auto' ? 'Auto' : quality.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-2 rounded text-sm font-medium transition-all"
                >
                  {playbackSpeed}x
                </button>
                
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-95 rounded-lg py-2 min-w-[100px] shadow-lg">
                    {speedOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => changeSpeed(option.value)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-white hover:bg-opacity-10 transition-colors ${
                          playbackSpeed === option.value ? 'text-blue-400 font-bold' : 'text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-white text-2xl font-bold mb-2">
            {videoData.title}
          </h1>
          {videoData.description && (
            <p className="text-gray-400">{videoData.description}</p>
          )}
          {videoData.originalWidth && videoData.originalHeight && (
            <p className="text-gray-500 text-sm mt-2">
              {videoData.originalWidth}x{videoData.originalHeight} • {videoData.videoDuration}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


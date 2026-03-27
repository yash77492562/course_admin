'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomVideoPlayer } from '@/components/features/VideoPlayer/CustomVideoPlayer';

interface VideoPlayerPageProps {
  videoId: string;
}

interface VideoData {
  title: string;
  videoUrl: string;
  videoType: 'UPLOAD' | 'YOUTUBE';
  description?: string;
  videoUrls?: Record<string, string>; // Multiple quality URLs
  thumbnail?: string; // Thumbnail URL
}

export function VideoPlayerPage({ videoId }: VideoPlayerPageProps) {
  const searchParams = useSearchParams();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert YouTube URL to cleanest possible embed URL
  const convertToCleanEmbedUrl = (youtubeUrl: string): string => {
    let videoId = '';
    
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      videoId = youtubeUrl.split('v=')[1].split('&')[0];
    } else if (youtubeUrl.includes('youtu.be/')) {
      videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
    } else if (youtubeUrl.includes('youtube.com/embed/') || youtubeUrl.includes('youtube-nocookie.com/embed/')) {
      // Extract video ID from embed URL
      videoId = youtubeUrl.split('/embed/')[1].split('?')[0];
    } else {
      // Try to extract video ID from any YouTube URL
      const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoIdMatch) {
        videoId = videoIdMatch[1];
      }
    }

    // Use most aggressive branding removal - remove ALL controls and UI
    // controls=0: Remove all YouTube controls
    // modestbranding=1: Remove YouTube logo
    // rel=0: Only related videos from same channel
    // showinfo=0: Hide title/uploader (deprecated but may work)
    // iv_load_policy=3: Disable annotations
    // cc_load_policy=0: Disable captions
    // disablekb=1: Disable keyboard shortcuts
    // fs=0: Disable fullscreen button
    // playsinline=1: Play inline on mobile
    // autoplay=0: Don't autoplay
    // loop=1: Loop the video to prevent related videos
    // playlist=${videoId}: Required for loop to work
    return `https://www.youtube-nocookie.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0&playsinline=1&autoplay=0&loop=1&playlist=${videoId}`;
  };

  useEffect(() => {
    const loadVideoData = async () => {
      try {
        setLoading(true);
        
        // First try to get data from URL parameter (for backward compatibility)
        const dataParam = searchParams.get('data');
        if (dataParam) {
          try {
            const decodedData = JSON.parse(decodeURIComponent(dataParam));
            
            if (!decodedData.videoUrl || decodedData.videoUrl.trim() === '') {
              setError('No video URL provided');
              return;
            }
            
            setVideoData(decodedData);
            return;
          } catch (parseError) {
            console.error('Failed to parse video data from URL:', parseError);
            // Continue to fetch from API
          }
        }
        
        // Fetch video data from backend API
        console.log('Fetching video data from API for lesson:', videoId);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/lessons/${videoId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.status}`);
        }
        
        const lesson = await response.json();
        console.log('Lesson data from API:', lesson);
        
        if (!lesson.videoUrl && !lesson.videoUrls) {
          setError('No video available for this lesson');
          return;
        }
        
        setVideoData({
          title: lesson.title,
          videoUrl: lesson.videoUrl || '',
          videoType: lesson.videoType || 'UPLOAD',
          description: lesson.description || '',
          videoUrls: lesson.videoUrls,
          thumbnail: lesson.thumbnail
        });
        
      } catch (err) {
        setError('Failed to load video');
        console.error('Error loading video:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [videoId, searchParams]);

  const handleGoBack = () => {
    window.close();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-xl mb-4">
          {error || 'Video not found'}
        </div>
        <button 
          onClick={handleGoBack}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-lg font-medium">
              {videoData.title.replace('🎥 ', '')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {videoData.videoType === 'YOUTUBE' ? 'YouTube' : 'Uploaded'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Video Player Section */}
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              {videoData.videoType === 'YOUTUBE' ? (
                <div className="absolute top-0 left-0 w-full h-full bg-black youtube-container">
                  <iframe
                    src={convertToCleanEmbedUrl(videoData.videoUrl)}
                    title={videoData.title}
                    className="absolute top-0 left-0 w-full h-full youtube-iframe"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ 
                      backgroundColor: '#000',
                      border: 'none',
                      outline: 'none'
                    }}
                  />
                  
                  {/* Custom play button overlay */}
                  <div className="youtube-custom-controls">
                    <button 
                      className="youtube-play-button"
                      onClick={() => {
                        // Click on the iframe to start playing
                        const iframe = document.querySelector('.youtube-iframe') as HTMLIFrameElement;
                        if (iframe) {
                          iframe.click();
                        }
                      }}
                    >
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Precise overlays to hide any remaining YouTube UI */}
                  <div className="youtube-overlay-container">
                    {/* Hide any title that might appear */}
                    <div className="youtube-title-overlay"></div>
                    
                    {/* Hide any bottom UI elements */}
                    <div className="youtube-bottom-overlay"></div>
                  </div>
                </div>
              ) : (
                // For uploaded videos, use custom player with quality controls
                videoData.videoUrls && Object.keys(videoData.videoUrls).length > 0 ? (
                  <CustomVideoPlayer
                    videoUrls={videoData.videoUrls}
                    thumbnail={videoData.thumbnail}
                    title={videoData.title}
                    className="absolute top-0 left-0 w-full h-full"
                  />
                ) : videoData.videoUrl?.startsWith('blob:') ? (
                  <video
                    src={videoData.videoUrl}
                    title={videoData.title}
                    className="absolute top-0 left-0 w-full h-full object-contain"
                    controls
                    autoPlay={false}
                    style={{ backgroundColor: '#000' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe
                    src={videoData.videoUrl}
                    title={videoData.title}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    style={{ backgroundColor: '#000' }}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Sidebar (Optional) */}
        <div className="w-full lg:w-80 bg-gray-800 border-l border-gray-700">
          <div className="p-4">
            <h2 className="text-white text-lg font-medium mb-4">Video Information</h2>
            
            {/* Video Details */}
            <div className="space-y-3">
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-1">Title</h3>
                <p className="text-white">{videoData.title.replace('🎥 ', '')}</p>
              </div>
              
              {videoData.description && (
                <div>
                  <h3 className="text-gray-300 text-sm font-medium mb-1">Description</h3>
                  <p className="text-gray-400 text-sm">{videoData.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-1">Type</h3>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">
                    {videoData.videoType === 'YOUTUBE' ? '📺' : '🎬'}
                  </span>
                  <span className="text-white text-sm">
                    {videoData.videoType === 'YOUTUBE' ? 'YouTube Video' : 'Uploaded Video'}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-1">Video ID</h3>
                <p className="text-gray-400 text-sm font-mono">{videoId}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors">
                Share Video
              </button>
              {videoData.videoType === 'UPLOAD' && (
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
                  Download
                </button>
              )}
              <button 
                onClick={handleGoBack}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom CSS for completely clean YouTube player
const youtubeCleanStyles = `
  .youtube-container {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    background: #000;
  }
  
  .youtube-iframe {
    border: none !important;
    outline: none !important;
    pointer-events: auto;
  }
  
  /* Custom play button */
  .youtube-custom-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 15;
    pointer-events: none;
  }
  
  .youtube-play-button {
    background: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }
  
  .youtube-play-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
  
  /* Hide play button when video is playing */
  .youtube-container:hover .youtube-play-button {
    opacity: 0;
    pointer-events: none;
  }
  
  .youtube-overlay-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;
  }
  
  /* Hide any title that might appear at top */
  .youtube-title-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: #000;
    pointer-events: none;
  }
  
  /* Hide any bottom UI elements */
  .youtube-bottom-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: #000;
    pointer-events: none;
  }
  
  /* Ensure the video area remains clickable for play/pause */
  .youtube-container::after {
    content: '';
    position: absolute;
    top: 80px;
    left: 0;
    right: 0;
    bottom: 100px;
    pointer-events: auto;
    z-index: 5;
    background: transparent;
  }
  
  /* Reduce overlay opacity on hover to allow some interaction */
  .youtube-container:hover .youtube-title-overlay,
  .youtube-container:hover .youtube-bottom-overlay {
    opacity: 0.1;
    transition: opacity 0.3s ease;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('youtube-clean-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'youtube-clean-styles';
    styleSheet.type = 'text/css';
    styleSheet.innerText = youtubeCleanStyles;
    document.head.appendChild(styleSheet);
  }
}
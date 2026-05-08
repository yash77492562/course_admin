'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with Video.js
const VideoPlayerWrapper = dynamic(
  () => import('@/components/features/VideoPlayer').then(mod => ({ default: mod.VideoPlayerWrapper })),
  { ssr: false }
);

interface VideoPlayerPageProps {
  videoId: string;
}

interface VideoData {
  title: string;
  videoUrl: string;
  videoType: 'UPLOAD' | 'YOUTUBE';
  description?: string;
  videoUrls?: Record<string, string>; // Multiple quality URLs
  hlsMasterPlaylist?: string; // HLS master playlist
  hlsQualities?: Record<string, string>; // HLS quality playlists
  thumbnail?: string; // Thumbnail URL
}

export function VideoPlayerPage({ videoId }: VideoPlayerPageProps) {
  const searchParams = useSearchParams();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideoData = async () => {
      try {
        setLoading(true);
        
        // Fetch directly from backend API to get fresh proxy URLs
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        console.log('Fetching video data from backend for lesson:', videoId);
        
        const response = await fetch(`${apiUrl}/lessons/${videoId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Backend API Response:', result);
        
        // Handle wrapped response
        const lesson = result.data || result;
        console.log('Lesson data from backend:', lesson);
        
        if (!lesson.videoUrl && !lesson.videoUrls && !lesson.hlsQualities) {
          setError('No video available for this lesson');
          return;
        }
        
        setVideoData({
          title: lesson.title,
          videoUrl: lesson.videoUrl || '',
          videoType: lesson.videoType || 'UPLOAD',
          description: lesson.description || '',
          videoUrls: lesson.videoUrls,
          hlsMasterPlaylist: lesson.hlsMasterPlaylist,
          hlsQualities: lesson.hlsQualities,
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
  }, [videoId]);

  const handleGoBack = () => {
    window.close();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
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
            <VideoPlayerWrapper
              videoType={videoData.videoType}
              hlsMasterPlaylist={videoData.hlsMasterPlaylist}
              hlsQualities={videoData.hlsQualities}
              videoUrls={videoData.videoUrls}
              videoUrl={videoData.videoUrl}
              thumbnail={videoData.thumbnail}
              title={videoData.title}
              autoplay={false}
              className="rounded-lg overflow-hidden"
            />
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
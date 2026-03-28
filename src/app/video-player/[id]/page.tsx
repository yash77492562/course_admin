'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with Video.js
const VideoPlayerWrapper = dynamic(
  () => import('@/components/features/VideoPlayer').then(mod => ({ default: mod.VideoPlayerWrapper })),
  { ssr: false }
);

export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.id as string;
  
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        // First check if data is passed via URL parameter (for preview before saving)
        const dataParam = searchParams.get('data');
        if (dataParam) {
          try {
            const decodedData = JSON.parse(decodeURIComponent(dataParam));
            console.log('📹 Using data from URL parameter:', decodedData);
            setVideoData(decodedData);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Failed to parse video data from URL:', parseError);
            // Continue to fetch from API
          }
        }

        // Fetch from API if no URL parameter
        const response = await fetch(`/api/lessons/${videoId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setVideoData(result.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load video:', error);
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, searchParams]);

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

  console.log('📹 Video Data:', videoData);
  console.log('📹 Video Type:', videoData.videoType);
  console.log('📹 HLS Master Playlist:', videoData.hlsMasterPlaylist);
  console.log('📹 HLS Qualities:', videoData.hlsQualities);
  console.log('📹 Video URLs:', videoData.videoUrls);
  console.log('📹 Video URL:', videoData.videoUrl);

  // Check video type and availability
  const isYouTube = videoData.videoType === 'YOUTUBE';
  const hasHLS = videoData.hlsMasterPlaylist || (videoData.hlsQualities && Object.keys(videoData.hlsQualities).length > 0);
  const hasMP4 = videoData.videoUrls && Object.keys(videoData.videoUrls).length > 0;
  
  // For YouTube videos, only check if videoUrl exists
  if (isYouTube && !videoData.videoUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">No YouTube URL available</div>
          <div className="text-gray-400 text-sm">
            This lesson doesn't have a YouTube URL set.
            <br />
            Please add the YouTube URL from the course editor.
          </div>
        </div>
      </div>
    );
  }
  
  // For uploaded videos, check if HLS or MP4 is available
  if (!isYouTube && !hasHLS && !hasMP4) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">No video source available</div>
          <div className="text-gray-400 text-sm">
            This lesson doesn't have any video uploaded yet.
            <br />
            Please upload and publish the video from the course editor.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8">
        {/* Video Container */}
        <div className="w-full max-w-6xl mx-auto">
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

        {/* Video Info */}
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-white text-2xl font-bold mb-2">
            {videoData.title}
          </h1>
          {videoData.description && (
            <p className="text-gray-400">{videoData.description}</p>
          )}
          {videoData.videoType === 'YOUTUBE' && (
            <p className="text-gray-500 text-sm mt-2">
              📺 YouTube Video
            </p>
          )}
          {videoData.videoType === 'UPLOAD' && videoData.originalWidth && videoData.originalHeight && (
            <p className="text-gray-500 text-sm mt-2">
              {videoData.originalWidth}x{videoData.originalHeight} • {Math.round(videoData.videoDuration || 0)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


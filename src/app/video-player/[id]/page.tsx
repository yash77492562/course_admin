'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with Video.js
const HLSVideoPlayer = dynamic(
  () => import('@/components/features/VideoPlayer/HLSVideoPlayer').then(mod => ({ default: mod.HLSVideoPlayer })),
  { ssr: false }
);

export default function VideoPlayerPage() {
  const params = useParams();
  const videoId = params.id as string;
  
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideo = async () => {
      try {
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
  }, [videoId]);

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
  console.log('📹 HLS Master Playlist:', videoData.hlsMasterPlaylist);
  console.log('📹 HLS Qualities:', videoData.hlsQualities);
  console.log('📹 Video URLs:', videoData.videoUrls);

  // Check if video has any playable source
  const hasHLS = videoData.hlsMasterPlaylist || (videoData.hlsQualities && Object.keys(videoData.hlsQualities).length > 0);
  const hasMP4 = videoData.videoUrls && Object.keys(videoData.videoUrls).length > 0;
  
  // Special case: video was processed but HLS data wasn't saved
  const isProcessedButMissingHLS = videoData.videoUrl === 'processed' && !hasHLS && !hasMP4;
  
  if (isProcessedButMissingHLS) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-yellow-400 text-xl mb-4">⚠️ Video Processing Incomplete</div>
          <div className="text-gray-400 text-sm space-y-2">
            <p>This video was processed but the streaming data wasn't saved to the database.</p>
            <p className="font-semibold text-white mt-4">To fix this:</p>
            <ol className="text-left list-decimal list-inside space-y-1 mt-2">
              <li>Go to the course editor</li>
              <li>Re-upload the video</li>
              <li>Click "Publish" to save the HLS streaming data</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }
  
  if (!hasHLS && !hasMP4) {
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
          <HLSVideoPlayer
            hlsMasterPlaylist={videoData.hlsMasterPlaylist}
            hlsQualities={videoData.hlsQualities}
            videoUrls={videoData.videoUrls}
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
          {videoData.originalWidth && videoData.originalHeight && (
            <p className="text-gray-500 text-sm mt-2">
              {videoData.originalWidth}x{videoData.originalHeight} • {Math.round(videoData.videoDuration || 0)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


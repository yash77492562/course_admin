import { useState, useCallback } from 'react';
import { uploadService } from '@/lib/upload/uploadService';
import { EnhancedVideoUploadData } from '@/components/features/VideoUploader';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseVideoUploadReturn {
  uploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  uploadVideo: (data: EnhancedVideoUploadData, lessonId: string) => Promise<void>;
  reset: () => void;
}

export function useVideoUpload(): UseVideoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = useCallback(async (data: EnhancedVideoUploadData, lessonId: string) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(null);

      if (data.type === 'upload') {
        // Video already uploaded to backend via EnhancedVideoUploader
        // Just mark as complete
        setProgress({ loaded: 1, total: 1, percentage: 100 });
      } else if (data.type === 'youtube' && data.videoUrl) {
        // Handle YouTube URL
        await uploadService.addYouTubeVideo(lessonId, data.videoUrl);
      } else {
        throw new Error('Invalid video data');
      }

      // Success - progress will be 100% for file uploads
      if (data.type === 'youtube') {
        setProgress({ loaded: 1, total: 1, percentage: 100 });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Video upload error:', err);
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadVideo,
    reset,
  };
}
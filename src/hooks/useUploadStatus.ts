import { useState, useEffect, useCallback } from 'react';

interface UploadStatus {
  isLocked: boolean;
  lockOwner?: string;
  progress: number;
  stage: string;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  message: string;
  fileName?: string;
  uploadedBy?: string;
  error?: string;
  queuePosition?: number | null; // Queue position (null = active, number = waiting)
  moduleName?: string; // NEW: Module name for display
  lessonName?: string; // NEW: Lesson name for display
}

export function useUploadStatus(courseId: string) {
  const [status, setStatus] = useState<UploadStatus>({
    isLocked: false,
    progress: 0,
    stage: 'idle',
    status: 'idle',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch upload status
  const fetchStatus = useCallback(async () => {
    // Skip if courseId is 'new' or empty
    if (!courseId || courseId === 'new') {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/upload/status/${courseId}`);
      const data = await response.json();

      if (data.isLocked && data.currentUpload) {
        setStatus({
          isLocked: true,
          lockOwner: data.lockOwner,
          ...data.currentUpload,
        });
      } else {
        setStatus({
          isLocked: false,
          progress: 0,
          stage: 'idle',
          status: 'idle',
          message: '',
        });
      }
    } catch (error) {
      console.error('Error fetching upload status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Poll for status updates every 2 seconds
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Refresh status manually
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    refresh,
  };
}

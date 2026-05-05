import { useState, useEffect, useCallback } from 'react';

interface JobProgress {
  id: string;
  courseId: string;
  lessonId: string;
  fileName: string;
  moduleName?: string;
  lessonName?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  progress: number;
  stage: string;
  message?: string;
  error?: string;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  videoUrls?: any;
  thumbnailUrl?: string;
  masterPlaylistUrl?: string;
}

/**
 * Hook to track video processing progress
 * UPDATED: Now polls Redis endpoint with videoId for real-time updates
 */
export function useJobProgress(jobId: string | null, videoId?: string) {
  const [job, setJob] = useState<JobProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    // If we have videoId, use Redis endpoint (faster)
    if (videoId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video-processing/progress/${videoId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch progress from Redis');
        }

        const data = await response.json();
        
        if (data.success && data.progress) {
          // Convert Redis progress to JobProgress format
          setJob({
            id: jobId || '',
            courseId: data.progress.courseId,
            lessonId: data.progress.lessonId,
            fileName: data.progress.fileName,
            status: data.progress.status === 'completed' ? 'COMPLETED' : 
                    data.progress.status === 'failed' ? 'FAILED' : 
                    data.progress.status === 'processing' ? 'PROCESSING' : 'QUEUED',
            progress: data.progress.progress,
            stage: data.progress.stage,
            message: data.progress.message,
            createdAt: data.progress.updatedAt,
            updatedAt: data.progress.updatedAt,
          } as JobProgress);
          setError(null);
        } else if (jobId) {
          // Fallback to database if no Redis data
          await fetchFromDatabase();
        }
      } catch (err) {
        console.error('Error fetching progress from Redis:', err);
        // Fallback to database
        if (jobId) {
          await fetchFromDatabase();
        }
      } finally {
        setIsLoading(false);
      }
    } else if (jobId) {
      // No videoId, use database endpoint
      await fetchFromDatabase();
    } else {
      setIsLoading(false);
    }
  }, [jobId, videoId]);

  const fetchFromDatabase = async () => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video-processing/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job progress');
      }

      const data = await response.json();
      
      if (data.success && data.job) {
        setJob(data.job);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching job progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll every 2 seconds for Redis (faster), 15 seconds for database
  useEffect(() => {
    if (!jobId && !videoId) return;

    // Initial fetch
    fetchProgress();

    // Set up polling interval
    const pollInterval = videoId ? 2000 : 15000; // 2s for Redis, 15s for DB
    const interval = setInterval(() => {
      fetchProgress();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, videoId, fetchProgress]);

  // Refresh manually
  const refresh = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    job,
    isLoading,
    error,
    refresh,
  };
}

// Types for video processing (mirrored from backend)
// These are re-declared here since admin cannot import from backend

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
}

export interface VideoAnalysisResult {
  width: number;
  height: number;
  duration: number;
  availableQualities: string[];
  isValid: boolean;
  error?: string;
}

export interface QualityProgress {
  quality: string;
  status: 'pending' | 'processing' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export interface ProcessingStatus {
  lessonId: string;
  status: 'queued' | 'analyzing' | 'processing' | 'uploading' | 'complete' | 'error' | 'connecting' | 'heartbeat';
  progress: number;
  queuePosition?: number;
  currentQuality?: string;
  qualityProgress?: QualityProgress[];
  message?: string;
  error?: string;
  videoUrls?: Record<string, string>;
  thumbnailUrl?: string;
}

export interface ProcessVideoResponse {
  success: boolean;
  message?: string;
  lessonId?: string;
  error?: string;
}

export interface AnalyzeVideoResponse {
  success: boolean;
  analysis: VideoAnalysisResult;
  uploadId: string; // Changed from tempPath
  error?: string;
}

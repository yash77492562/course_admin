/**
 * Backend Video Uploader - NEW SYSTEM
 * Synced with backend /api/video-processing endpoints
 * 
 * Flow:
 * 1. Analyze video (browser-side for instant feedback)
 * 2. Send file to backend /api/video-processing/analyze
 * 3. Start processing with /api/video-processing/process
 * 4. Poll /api/video-processing/progress/:videoId for real-time updates
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface UploadProgress {
  quality: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  chunksUploaded: number;
  totalChunks: number;
}

export interface ProcessingProgress {
  lessonId: string;
  status: 'analyzing' | 'processing' | 'uploading' | 'complete' | 'error';
  progress: number;
  currentQuality?: string;
  qualityProgress: {
    quality: string;
    status: 'pending' | 'processing' | 'uploading' | 'complete' | 'error';
    progress: number;
    error?: string;
  }[];
  message?: string;
  error?: string;
  videoUrls?: Record<string, string>;
  thumbnailUrl?: string;
  masterPlaylistUrl?: string;
  // NEW: Step-based progress
  currentStep?: number;
  stepProgress?: number;
  segmentsUploaded?: number;
  totalSegments?: number;
}

export class BackendVideoUploader {
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Analyze video (browser-side for instant feedback)
   */
  async analyzeVideo(file: File): Promise<{
    width: number;
    height: number;
    duration: number;
    availableQualities: string[];
    canProcess: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;

        URL.revokeObjectURL(video.src);

        // Check minimum 460p
        if (height < 460) {
          resolve({
            width,
            height,
            duration,
            availableQualities: [],
            canProcess: false,
            error: 'Video quality too low (minimum 460p required)',
          });
          return;
        }

        // Determine available qualities
        const availableQualities: string[] = [];
        if (height >= 460) availableQualities.push('460p');
        if (height >= 720) availableQualities.push('720p');
        if (height >= 1080) availableQualities.push('1080p');

        resolve({
          width,
          height,
          duration,
          availableQualities,
          canProcess: true,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          width: 0,
          height: 0,
          duration: 0,
          availableQualities: [],
          canProcess: false,
          error: 'Failed to load video',
        });
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload video to backend for processing
   * NEW SYSTEM: Uses /api/video-processing endpoints
   */
  async uploadVideo(
    file: File,
    lessonId: string,
    lessonName: string,
    qualities: string[],
    onUploadProgress?: (progress: UploadProgress[]) => void,
    onProcessingProgress?: (progress: ProcessingProgress) => void,
    courseId?: string,
    moduleName?: string
  ): Promise<{ lessonId: string; jobId: string }> {
    console.log('🚀 Starting NEW video upload system');
    console.log('   File:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log('   Qualities:', qualities);

    try {
      // Step 1: Send file to backend for analysis
      console.log('📤 Step 1: Sending file to backend for analysis...');
      const formData = new FormData();
      formData.append('file', file);

      const analyzeResponse = await fetch(`${API_BASE}/api/video-processing/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        throw new Error(error.message || 'Failed to analyze video');
      }

      const { uploadId, analysis } = await analyzeResponse.json();
      console.log('✅ Analysis complete, uploadId:', uploadId);
      console.log('   Resolution:', `${analysis.width}x${analysis.height}`);
      console.log('   Duration:', `${analysis.duration}s`);

      // Simulate upload progress (file is already uploaded in analyze step)
      if (onUploadProgress) {
        onUploadProgress([{
          quality: qualities[0],
          progress: 100,
          status: 'complete',
          chunksUploaded: 1,
          totalChunks: 1,
        }]);
      }

      // Step 2: Start processing
      console.log('📤 Step 2: Starting video processing...');
      const processResponse = await fetch(`${API_BASE}/api/video-processing/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          lessonId, // Frontend temp ID (backend will replace with MongoDB ObjectID)
          lessonName,
          qualities,
          courseId,
          moduleName,
        }),
      });

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.message || 'Failed to start processing');
      }

      const { lessonId: newLessonId, jobId, bullmqJobId } = await processResponse.json();
      console.log('✅ Processing started!');
      console.log('   NEW lessonId (MongoDB ObjectID):', newLessonId);
      console.log('   jobId:', jobId);
      console.log('   bullmqJobId:', bullmqJobId);

      // Step 3: Poll for progress with NEW lessonId
      if (onProcessingProgress) {
        console.log('📊 Step 3: Starting progress polling with NEW lessonId...');
        this.pollProgress(newLessonId, onProcessingProgress);
      }

      return { lessonId: newLessonId, jobId };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  /**
   * Poll for processing progress from Redis
   * Uses NEW lessonId (MongoDB ObjectID) from backend
   */
  private pollProgress(
    lessonId: string,
    onProgress: (progress: ProcessingProgress) => void
  ): void {
    console.log('🔄 Starting progress polling for lessonId:', lessonId);

    // Clear any existing poll
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Poll every 1 second
    this.pollInterval = setInterval(async () => {
      try {
        console.log('🔄 ========== POLLING PROGRESS ==========');
        console.log('🔄 Fetching from:', `${API_BASE}/api/video-processing/progress/${lessonId}`);
        
        const response = await fetch(`${API_BASE}/api/video-processing/progress/${lessonId}`);
        
        if (!response.ok) {
          console.warn('❌ Failed to fetch progress:', response.statusText);
          return;
        }

        const data = await response.json();
        
        console.log('📥 Raw API Response:', JSON.stringify(data, null, 2));
        
        if (!data.success || !data.progress) {
          console.log('⚠️ No progress data yet...');
          return;
        }

        const redisProgress = data.progress;
        console.log('📊 ========== REDIS PROGRESS DATA ==========');
        console.log('   Status:', redisProgress.status);
        console.log('   Progress:', redisProgress.progress + '%');
        console.log('   Stage:', redisProgress.stage);
        console.log('   CurrentStep:', redisProgress.currentStep);
        console.log('   StepProgress:', redisProgress.stepProgress);
        console.log('   Message:', redisProgress.message);
        console.log('   SegmentsUploaded:', redisProgress.segmentsUploaded);
        console.log('   TotalSegments:', redisProgress.totalSegments);
        console.log('========================================');

        // Convert Redis progress to ProcessingProgress format
        const progress: ProcessingProgress = {
          lessonId: redisProgress.lessonId || lessonId,
          status: redisProgress.status === 'completed' || redisProgress.status === 'complete' ? 'complete' : 
                  redisProgress.status === 'failed' ? 'error' : 
                  redisProgress.status === 'processing' ? 'processing' : 'analyzing',
          progress: redisProgress.progress || 0,
          currentQuality: redisProgress.stage?.includes('460p') ? '460p' :
                         redisProgress.stage?.includes('720p') ? '720p' :
                         redisProgress.stage?.includes('1080p') ? '1080p' : undefined,
          qualityProgress: [{
            quality: '460p',
            status: redisProgress.progress >= 100 ? 'complete' : 'processing',
            progress: redisProgress.progress || 0,
          }],
          // CRITICAL FIX: Use Redis message directly (contains step info)
          message: redisProgress.message || `${redisProgress.stage} - ${redisProgress.progress}%`,
          error: redisProgress.status === 'failed' ? redisProgress.message : undefined,
          // NEW: Pass step info from Redis
          currentStep: redisProgress.currentStep,
          stepProgress: redisProgress.stepProgress,
          segmentsUploaded: redisProgress.segmentsUploaded,
          totalSegments: redisProgress.totalSegments,
        };

        console.log('📤 ========== SENDING TO COMPONENT ==========');
        console.log('   Progress:', progress.progress + '%');
        console.log('   CurrentStep:', progress.currentStep);
        console.log('   StepProgress:', progress.stepProgress);
        console.log('   Message:', progress.message);
        console.log('   Status:', progress.status);
        console.log('========================================');

        onProgress(progress);

        // Stop polling when complete or error
        if (progress.status === 'complete' || progress.status === 'error') {
          console.log('✅ Processing finished, stopping poll');
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }

          // Fetch final video URLs if complete
          if (progress.status === 'complete') {
            await this.fetchFinalVideoUrls(lessonId, onProgress);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 1000); // Poll every 1 second for real-time updates
  }

  /**
   * Fetch final video URLs from database after processing completes
   * CRITICAL FIX: Get URLs from VideoUploadJob, not Lesson (lesson doesn't exist yet)
   */
  private async fetchFinalVideoUrls(
    lessonId: string,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<void> {
    try {
      console.log('📥 ========== FETCHING FINAL VIDEO URLS ==========');
      console.log('   LessonId:', lessonId);
      console.log('   Endpoint:', `${API_BASE}/api/video-processing/jobs/${lessonId}`);
      
      // CRITICAL FIX: Fetch from VideoUploadJob, not Lesson
      // The lesson doesn't exist in database yet - it will be created when course is published
      const response = await fetch(`${API_BASE}/api/video-processing/jobs/${lessonId}`);
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch video upload job data');
        console.warn('   Status:', response.status, response.statusText);
        // Don't fail - just send completion without URLs
        onProgress({
          lessonId,
          status: 'complete',
          progress: 100,
          qualityProgress: [],
          message: 'Processing complete! Video will be saved when you publish the course.',
        });
        return;
      }

      const { job } = await response.json();
      
      console.log('✅ Got VideoUploadJob data:');
      console.log('   Job ID:', job.id);
      console.log('   Status:', job.status);
      console.log('   Video URLs:', JSON.stringify(job.videoUrls, null, 2));
      console.log('   Thumbnail:', job.thumbnailUrl);
      console.log('   Master Playlist:', job.masterPlaylistUrl);
      
      // CRITICAL: Check if videoUrls is actually populated
      if (!job.videoUrls || Object.keys(job.videoUrls).length === 0) {
        console.error('❌ VideoUploadJob has NO video URLs!');
        console.error('   This means the worker did not store URLs correctly');
        console.error('   Job data:', JSON.stringify(job, null, 2));
      }
      
      if (job && job.videoUrls && job.thumbnailUrl) {
        console.log('✅ Got final video URLs from VideoUploadJob:');
        console.log('   Video URLs:', job.videoUrls);
        console.log('   Thumbnail:', job.thumbnailUrl);
        console.log('   Master Playlist:', job.masterPlaylistUrl);

        // Send final progress with video URLs
        const finalProgress = {
          lessonId,
          status: 'complete' as const,
          progress: 100,
          qualityProgress: [],
          message: 'Processing complete!',
          videoUrls: job.videoUrls,
          thumbnailUrl: job.thumbnailUrl,
          masterPlaylistUrl: job.masterPlaylistUrl,
        };
        
        console.log('📤 Calling onProgress with final data:', JSON.stringify(finalProgress, null, 2));
        onProgress(finalProgress);
      } else {
        console.warn('⚠️ VideoUploadJob found but missing video URLs');
        console.warn('   Job:', JSON.stringify(job, null, 2));
        onProgress({
          lessonId,
          status: 'complete',
          progress: 100,
          qualityProgress: [],
          message: 'Processing complete! Video will be saved when you publish the course.',
        });
      }
      
      console.log('========================================');
    } catch (error) {
      console.error('❌ Error fetching final video URLs:', error);
      console.error('   Error details:', error instanceof Error ? error.message : String(error));
      // Don't fail - just send completion without URLs
      onProgress({
        lessonId,
        status: 'complete',
        progress: 100,
        qualityProgress: [],
        message: 'Processing complete! Video will be saved when you publish the course.',
      });
    }
  }

  /**
   * Stop polling (cleanup)
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('🛑 Progress polling stopped');
    }
  }
}

export const backendVideoUploader = new BackendVideoUploader();

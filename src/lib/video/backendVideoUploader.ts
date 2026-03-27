/**
 * Backend Video Uploader
 * Uploads video chunks to backend for processing
 * Listens to SSE for real-time progress updates
 */

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

const BACKEND_PORTS = {
  '460p': 'http://localhost:3010',
  '720p': 'http://localhost:3011',
  '1080p': 'http://localhost:3012',
  process: 'http://localhost:3013',
};

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
}

export class BackendVideoUploader {
  /**
   * Analyze video to determine available qualities
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
   * Uploads to all quality ports in PARALLEL
   * Listens to SSE for real-time processing progress
   */
  async uploadVideo(
    file: File,
    lessonId: string,
    lessonName: string,
    qualities: string[],
    onUploadProgress?: (progress: UploadProgress[]) => void,
    onProcessingProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    console.log(`🚀 Starting upload for ${qualities.length} qualities in PARALLEL`);

    // Upload to all quality ports in parallel
    const uploadPromises = qualities.map(quality =>
      this.uploadToQuality(file, lessonId, quality, onUploadProgress)
    );

    const uploadIds = await Promise.all(uploadPromises);

    console.log('✅ All uploads complete, starting processing...');

    // Trigger processing
    await this.triggerProcessing(uploadIds, lessonId, lessonName);

    console.log('✅ Video processing started, listening for progress...');

    // Listen to SSE for processing progress
    if (onProcessingProgress) {
      this.listenToProcessingProgress(lessonId, onProcessingProgress);
    }
  }

  /**
   * Listen to SSE for real-time processing progress
   */
  private listenToProcessingProgress(
    lessonId: string,
    onProgress: (progress: ProcessingProgress) => void
  ): void {
    const eventSource = new EventSource(`${BACKEND_PORTS.process}/video-process/status/${lessonId}`);

    eventSource.onmessage = (event) => {
      try {
        const progress: ProcessingProgress = JSON.parse(event.data);
        onProgress(progress);

        // Close connection when complete or error
        if (progress.status === 'complete' || progress.status === 'error') {
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };
  }

  /**
   * Upload to a specific quality port
   */
  private async uploadToQuality(
    file: File,
    lessonId: string,
    quality: string,
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<string> {
    const port = BACKEND_PORTS[quality as keyof typeof BACKEND_PORTS];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Initiate upload
    const initiateResponse = await fetch(`${port}/video-upload-${quality}/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId,
        fileName: file.name,
        fileSize: file.size,
        quality,
      }),
    });

    if (!initiateResponse.ok) {
      throw new Error(`Failed to initiate ${quality} upload`);
    }

    const { uploadId } = await initiateResponse.json();

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('quality', quality);

      const chunkResponse = await fetch(`${port}/video-upload-${quality}/chunk`, {
        method: 'POST',
        body: formData,
      });

      if (!chunkResponse.ok) {
        throw new Error(`Failed to upload ${quality} chunk ${chunkIndex}`);
      }

      // Report progress
      if (onProgress) {
        onProgress([{
          quality,
          progress: ((chunkIndex + 1) / totalChunks) * 100,
          status: chunkIndex + 1 === totalChunks ? 'complete' : 'uploading',
          chunksUploaded: chunkIndex + 1,
          totalChunks,
        }]);
      }

      console.log(`${quality}: Chunk ${chunkIndex + 1}/${totalChunks} uploaded`);
    }

    return uploadId;
  }

  /**
   * Trigger video processing
   */
  private async triggerProcessing(
    uploadIds: string[],
    lessonId: string,
    lessonName: string
  ): Promise<void> {
    const response = await fetch(`${BACKEND_PORTS.process}/video-process/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadIds,
        lessonId,
        lessonName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start video processing');
    }
  }
}

export const backendVideoUploader = new BackendVideoUploader();

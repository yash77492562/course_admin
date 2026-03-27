interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface ChunkUploadResponse {
  success: boolean;
  chunkIndex: number;
  uploadId: string;
  isComplete?: boolean;
  videoUrl?: string;
}

interface InitiateUploadResponse {
  success: boolean;
  uploadId: string;
  chunkSize: number;
}

export class ChunkedUploadService {
  private baseUrl: string;
  private chunkSize: number = 5 * 1024 * 1024; // 5MB chunks

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002') {
    this.baseUrl = baseUrl;
  }

  async uploadVideo(
    file: File,
    lessonId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Step 1: Initiate upload
      const initResponse = await this.initiateUpload(file, lessonId);
      if (!initResponse.success) {
        throw new Error('Failed to initiate upload');
      }

      const { uploadId, chunkSize } = initResponse;
      this.chunkSize = chunkSize;

      // Step 2: Upload chunks
      const totalChunks = Math.ceil(file.size / this.chunkSize);
      let uploadedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize, file.size);
        const chunk = file.slice(start, end);

        const chunkResponse = await this.uploadChunk(
          chunk,
          chunkIndex,
          totalChunks,
          uploadId,
          lessonId
        );

        if (!chunkResponse.success) {
          throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
        }

        uploadedBytes += chunk.size;
        
        // Report progress
        if (onProgress) {
          onProgress({
            loaded: uploadedBytes,
            total: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100)
          });
        }

        // If this is the last chunk and upload is complete
        if (chunkResponse.isComplete && chunkResponse.videoUrl) {
          return chunkResponse.videoUrl;
        }
      }

      throw new Error('Upload completed but no video URL received');
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }

  private async initiateUpload(file: File, lessonId: string): Promise<InitiateUploadResponse> {
    const response = await fetch(`${this.baseUrl}/upload/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lessonId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async uploadChunk(
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    uploadId: string,
    lessonId: string
  ): Promise<ChunkUploadResponse> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('uploadId', uploadId);
    formData.append('lessonId', lessonId);

    const response = await fetch(`${this.baseUrl}/upload/chunk`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async uploadMultipleQualities(
    processedVideos: { quality: string; blob: Blob }[],
    thumbnail: Blob,
    lessonId: string,
    metadata: { originalWidth: number; originalHeight: number; duration: number },
    onProgress?: (progress: { quality: string; percentage: number; stage: string }) => void
  ): Promise<Record<string, string>> {
    console.log('🎬 uploadMultipleQualities called');
    console.log('📦 Processed videos:', processedVideos.length);
    console.log('📸 Thumbnail size:', thumbnail.size);
    console.log('🎯 Lesson ID:', lessonId);
    console.log('📐 Metadata:', metadata);
    
    const videoUrls: Record<string, string> = {};
    
    try {
      // Upload thumbnail first
      console.log('📸 Uploading thumbnail...');
      onProgress?.({ quality: 'thumbnail', percentage: 5, stage: 'Uploading thumbnail...' });
      const thumbnailUrl = await this.uploadThumbnail(thumbnail, lessonId);
      console.log('✅ Thumbnail uploaded:', thumbnailUrl);
      
      // Upload each quality version
      for (let i = 0; i < processedVideos.length; i++) {
        const { quality, blob } = processedVideos[i];
        
        console.log(`🎞️ Uploading quality ${i + 1}/${processedVideos.length}: ${quality}`);
        console.log(`   Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        
        onProgress?.({ 
          quality, 
          percentage: 10 + (i / processedVideos.length) * 80, 
          stage: `Uploading ${quality}...` 
        });
        
        // Convert blob to file for chunked upload
        const file = new File([blob], `video_${quality}.mp4`, { type: 'video/mp4' });
        
        // Use existing chunked upload for each quality
        const videoUrl = await this.uploadVideo(file, `${lessonId}_${quality}`, (progress) => {
          console.log(`   📈 ${quality} progress: ${progress.percentage}%`);
          onProgress?.({ 
            quality, 
            percentage: 10 + (i / processedVideos.length) * 80 + (progress.percentage / processedVideos.length) * 0.8, 
            stage: `Uploading ${quality}: ${progress.percentage}%` 
          });
        });
        
        videoUrls[quality] = videoUrl;
        console.log(`✅ ${quality} uploaded:`, videoUrl);
      }
      
      // Update lesson with all video URLs and metadata
      console.log('💾 Updating lesson in database...');
      console.log('   Video URLs:', videoUrls);
      console.log('   Thumbnail:', thumbnailUrl);
      await this.updateLessonWithMultipleQualities(lessonId, videoUrls, thumbnailUrl, metadata);
      console.log('✅ Lesson updated successfully!');
      
      onProgress?.({ quality: 'complete', percentage: 100, stage: 'Upload complete!' });
      
      return videoUrls;
    } catch (error) {
      console.error('❌ Multiple quality upload failed:', error);
      throw error;
    }
  }

  private async uploadThumbnail(thumbnail: Blob, lessonId: string): Promise<string> {
    const file = new File([thumbnail], `thumbnail_${lessonId}.jpg`, { type: 'image/jpeg' });
    
    const response = await fetch(`${this.baseUrl}/upload/thumbnail`, {
      method: 'POST',
      body: (() => {
        const formData = new FormData();
        formData.append('thumbnail', file);
        formData.append('lessonId', lessonId);
        return formData;
      })(),
    });

    if (!response.ok) {
      throw new Error(`Thumbnail upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.thumbnailUrl;
  }

  private async updateLessonWithMultipleQualities(
    lessonId: string,
    videoUrls: Record<string, string>,
    thumbnailUrl: string,
    metadata: { originalWidth: number; originalHeight: number; duration: number }
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/upload/lesson-qualities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessonId,
        videoUrls,
        thumbnailUrl,
        originalWidth: metadata.originalWidth,
        originalHeight: metadata.originalHeight,
        videoDuration: metadata.duration,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update lesson: ${response.status}`);
    }
  }

  async addYouTubeVideo(lessonId: string, youtubeUrl: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/upload/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessonId,
        youtubeUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to add YouTube video');
    }
  }
}

export const uploadService = new ChunkedUploadService();
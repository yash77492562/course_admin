// Direct R2 upload without lesson ID requirement
export class DirectR2Upload {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload multiple video qualities directly to R2
   * Returns R2 URLs that can be stored in the database
   */
  async uploadVideoQualities(
    processedVideos: { quality: string; blob: Blob }[],
    thumbnail: Blob,
    metadata: { originalWidth: number; originalHeight: number; duration: number },
    onProgress?: (progress: { quality: string; percentage: number; stage: string }) => void
  ): Promise<{
    videoUrls: Record<string, string>;
    thumbnailUrl: string;
    metadata: typeof metadata;
  }> {
    console.log('🎬 DirectR2Upload: Starting upload');
    console.log('📦 Qualities:', processedVideos.map(v => v.quality));
    
    const videoUrls: Record<string, string> = {};
    
    try {
      // Upload thumbnail
      console.log('📸 Uploading thumbnail...');
      onProgress?.({ quality: 'thumbnail', percentage: 5, stage: 'Uploading thumbnail...' });
      
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('file', thumbnail, 'thumbnail.jpg');
      
      const thumbnailResponse = await fetch(`${this.baseUrl}/api/upload/direct-thumbnail`, {
        method: 'POST',
        body: thumbnailFormData,
      });
      
      if (!thumbnailResponse.ok) {
        throw new Error(`Thumbnail upload failed: ${thumbnailResponse.status}`);
      }
      
      const thumbnailResult = await thumbnailResponse.json();
      const thumbnailUrl = thumbnailResult.url;
      console.log('✅ Thumbnail uploaded:', thumbnailUrl);
      
      // Upload each quality
      for (let i = 0; i < processedVideos.length; i++) {
        const { quality, blob } = processedVideos[i];
        
        console.log(`🎞️ Uploading ${quality}...`);
        onProgress?.({ 
          quality, 
          percentage: 10 + (i / processedVideos.length) * 85, 
          stage: `Uploading ${quality}...` 
        });
        
        const videoFormData = new FormData();
        videoFormData.append('file', blob, `video_${quality}.mp4`);
        videoFormData.append('quality', quality);
        
        const videoResponse = await fetch(`${this.baseUrl}/api/upload/direct-video`, {
          method: 'POST',
          body: videoFormData,
        });
        
        if (!videoResponse.ok) {
          throw new Error(`${quality} upload failed: ${videoResponse.status}`);
        }
        
        const videoResult = await videoResponse.json();
        videoUrls[quality] = videoResult.url;
        console.log(`✅ ${quality} uploaded:`, videoResult.url);
      }
      
      onProgress?.({ quality: 'complete', percentage: 100, stage: 'Upload complete!' });
      
      return {
        videoUrls,
        thumbnailUrl,
        metadata
      };
      
    } catch (error) {
      console.error('❌ DirectR2Upload failed:', error);
      throw error;
    }
  }
}

export const directR2Upload = new DirectR2Upload();

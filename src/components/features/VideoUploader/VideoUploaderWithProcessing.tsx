'use client';

import { useState, useRef, useEffect } from 'react';
import { QualitySelector } from './QualitySelector';
import { ProcessingProgress } from './ProcessingProgress';
import { useNotifications } from '@/contexts/NotificationContext';
import type {
  VideoMetadata,
  ProcessingStatus,
  AnalyzeVideoResponse,
  ProcessVideoResponse
} from '@/types/video-processing.types';

interface VideoUploaderWithProcessingProps {
  lessonId: string;
  lessonName: string;
  onComplete: (data: {
    videoUrls: Record<string, string>;
    thumbnailUrl: string;
    metadata: VideoMetadata;
  }) => void;
  onCancel: () => void;
}

export function VideoUploaderWithProcessing({
  lessonId,
  lessonName,
  onComplete,
  onCancel
}: VideoUploaderWithProcessingProps) {
  const [step, setStep] = useState<'upload' | 'quality-select' | 'processing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string>(''); // Changed from tempPath
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError, info } = useNotifications();

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        console.log('🧹 Cleaning up SSE connection');
        eventSource.close();
      }
    };
  }, [eventSource]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    console.log('📁 File selected:', selectedFile.name, `(${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      const errorMsg = 'Please select a valid video file';
      setError(errorMsg);
      showError('Invalid File', errorMsg);
      return;
    }

    setFile(selectedFile);
    setError('');

    // Analyze video
    await analyzeVideo(selectedFile);
  };

  const analyzeVideo = async (videoFile: File) => {
    try {
      setError('');
      setUploading(true);
      
      console.log('🔍 Starting video analysis...');
      info('Analyzing Video', 'Uploading and analyzing your video...');
      
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video-processing/analyze`, {
        method: 'POST',
        body: formData,
      });

      const result: AnalyzeVideoResponse = await response.json();

      console.log('📊 Analysis result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze video');
      }

      const { analysis, uploadId: id } = result;

      if (!analysis.isValid) {
        const errorMsg = analysis.error || 'Video quality too low (minimum 460p required)';
        setError(errorMsg);
        showError('Invalid Video', errorMsg);
        setUploading(false);
        return;
      }

      console.log('✅ Video analysis complete:');
      console.log(`   Resolution: ${analysis.width}x${analysis.height}`);
      console.log(`   Duration: ${analysis.duration}s`);
      console.log(`   Available qualities: ${analysis.availableQualities.join(', ')}`);

      // Store analysis results
      setAvailableQualities(analysis.availableQualities);
      setVideoMetadata({
        width: analysis.width,
        height: analysis.height,
        duration: analysis.duration,
      });
      setUploadId(id); // Changed from setTempPath
      setUploading(false);

      success(
        'Video Analyzed Successfully',
        `Resolution: ${analysis.width}x${analysis.height}, Available qualities: ${analysis.availableQualities.join(', ')}`
      );

      // Move to quality selection
      setStep('quality-select');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze video';
      console.error('❌ Video analysis failed:', err);
      setError(errorMsg);
      showError('Analysis Failed', errorMsg);
      setUploading(false);
    }
  };

  const handleQualityConfirm = async (selectedQualities: string[]) => {
    try {
      setError('');
      setStep('processing');

      console.log('🎬 Starting video processing with qualities:', selectedQualities);
      info('Starting Processing', `Processing ${selectedQualities.length} quality version(s)...`);

      // Start processing
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video-processing/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lessonName,
          qualities: selectedQualities,
          uploadId, // Changed from tempPath
        }),
      });

      const result: ProcessVideoResponse = await response.json();

      console.log('📤 Process request result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to start processing');
      }

      console.log('✅ Video added to processing queue');
      info('Video Queued', 'Your video has been added to the processing queue');

      // Connect to SSE for progress updates
      const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/video-processing/progress/${lessonId}`;
      console.log('📡 Connecting to SSE:', sseUrl);
      
      const es = new EventSource(sseUrl);

      es.onopen = () => {
        console.log('✅ SSE connection established');
      };

      es.onmessage = (event) => {
        const status = JSON.parse(event.data) as ProcessingStatus;
        console.log('📊 Progress update:', status);
        setProcessingStatus(status);

        // Show notifications for key status changes
        if (status.status === 'queued' && status.queuePosition) {
          info('Video Queued', `Position in queue: ${status.queuePosition}`);
        } else if (status.status === 'processing' && status.progress === 10) {
          info('Processing Started', 'Video processing has begun');
        } else if (status.status === 'complete' && status.videoUrls && status.thumbnailUrl && videoMetadata) {
          console.log('✅ Processing complete!');
          console.log('   Video URLs:', status.videoUrls);
          console.log('   Thumbnail:', status.thumbnailUrl);
          
          success(
            'Processing Complete!',
            `Video processed successfully with ${Object.keys(status.videoUrls).length} quality version(s)`
          );
          
          onComplete({
            videoUrls: status.videoUrls,
            thumbnailUrl: status.thumbnailUrl,
            metadata: videoMetadata,
          });
          es.close();
        } else if (status.status === 'error') {
          console.error('❌ Processing error:', status.error);
          showError('Processing Failed', status.error || 'An error occurred during processing');
          es.close();
        }
      };

      es.onerror = (err) => {
        console.error('❌ SSE connection error:', err);
        setError('Connection to server lost');
        showError('Connection Lost', 'Lost connection to server. Please try again.');
        es.close();
      };

      setEventSource(es);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start processing';
      console.error('❌ Failed to start processing:', err);
      setError(errorMsg);
      showError('Processing Failed', errorMsg);
      setStep('quality-select');
    }
  };

  const handleCancel = () => {
    console.log('🚫 User cancelled video upload');
    if (eventSource) {
      eventSource.close();
    }
    onCancel();
  };

  return (
    <>
      {/* Upload Step */}
      {step === 'upload' && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Video
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-blue-800">Analyzing video...</p>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>

            <p className="text-sm text-gray-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mb-4">
              MP4, WebM, or MOV (minimum 460p)
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Analyzing...' : 'Select Video'}
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quality Selection Step */}
      {step === 'quality-select' && (
        <QualitySelector
          availableQualities={availableQualities}
          onConfirm={handleQualityConfirm}
          onCancel={handleCancel}
          videoMetadata={videoMetadata || undefined}
          error={error}
        />
      )}

      {/* Processing Step */}
      {step === 'processing' && processingStatus && (
        <ProcessingProgress
          status={processingStatus.status}
          progress={processingStatus.progress}
          queuePosition={processingStatus.queuePosition}
          currentQuality={processingStatus.currentQuality}
          qualityProgress={processingStatus.qualityProgress}
          message={processingStatus.message}
          error={processingStatus.error}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

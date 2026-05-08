'use client';

import { useState, useRef, useEffect } from 'react';
import { QualitySelector } from './QualitySelector';
import { ProcessingProgress } from './ProcessingProgress';
import { useNotifications } from '@/contexts/NotificationContext';
import { backendVideoUploader, type UploadProgress, type ProcessingProgress as BackendProcessingProgress } from '@/lib/video/backendVideoUploader';
import type {
  VideoMetadata,
  ProcessingStatus,
  AnalyzeVideoResponse,
  ProcessVideoResponse
} from '@/types/video-processing.types';

interface VideoUploaderWithProcessingProps {
  courseId?: string; // NEW: For upload lock
  moduleId?: string; // NEW: For lesson creation in backend
  moduleName?: string; // NEW: For Redis display
  lessonId: string;
  lessonName: string;
  onComplete: (data: {
    videoUrls?: Record<string, string>;
    thumbnailUrl?: string;
    masterPlaylistUrl?: string;
    metadata?: VideoMetadata;
    videoType: 'UPLOAD' | 'YOUTUBE';
    youtubeUrl?: string;
  }) => void;
  onCancel: () => void;
}

export function VideoUploaderWithProcessing({
  courseId,
  moduleId,
  moduleName,
  lessonId,
  lessonName,
  onComplete,
  onCancel
}: VideoUploaderWithProcessingProps) {
  const [uploadType, setUploadType] = useState<'upload' | 'youtube'>('upload');
  const [step, setStep] = useState<'upload' | 'quality-select' | 'processing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError, info } = useNotifications();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting');
    };
  }, []);

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
      
      console.log('🔍 Starting video analysis (browser-side)...');
      info('Analyzing Video', 'Analyzing your video...');
      
      // NEW: Acquire upload lock if courseId is provided
      if (courseId) {
        console.log('🔒 Acquiring upload lock...');
        const lockResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/video/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonId,
            userId: 'admin1', // TODO: Get from auth context
            fileName: videoFile.name,
            fileSize: videoFile.size,
            moduleName, // Store in Redis for display
            lessonName, // Store in Redis for display
          }),
        });

        if (!lockResponse.ok) {
          const error = await lockResponse.json();
          if (error.error === 'COURSE_LOCKED') {
            throw new Error(`Course is locked by ${error.lockedBy}. Please wait for the current upload to complete.`);
          }
          throw new Error('Failed to acquire upload lock');
        }

        console.log('✅ Upload lock acquired');
      }
      
      // Use browser-side analysis (no upload yet!)
      const analysis = await backendVideoUploader.analyzeVideo(videoFile);

      console.log('📊 Analysis result:', analysis);

      if (!analysis.canProcess) {
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
      
      // NEW: Release lock on error if courseId is provided
      if (courseId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/cancel/${courseId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'admin1' }), // TODO: Get from auth context
          });
        } catch (releaseError) {
          console.error('Failed to release lock:', releaseError);
        }
      }
    }
  };

  const handleQualityConfirm = async (selectedQualities: string[]) => {
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      setError('');
      
      // IMPORTANT: Set step to 'processing' FIRST to show the 5-step window
      console.log('🎬 Transitioning to processing step - showing 5-step window');
      setStep('processing');
      
      // Initialize processing status to show the window immediately
      setProcessingStatus({
        lessonId: `frontend_${Date.now()}`,
        status: 'connecting',
        progress: 0,
        message: 'Initializing upload...',
      });
      
      setUploadProgress([]);

      console.log('🎬 Starting NEW video upload system with qualities:', selectedQualities);
      console.log('📝 Module ID:', moduleId);
      info('Starting Upload', `Uploading ${selectedQualities.length} quality version(s)...`);

      // Use NEW upload system
      const { lessonId: newLessonId, jobId } = await backendVideoUploader.uploadVideo(
        file,
        lessonId, // Frontend temp ID (backend will replace)
        lessonName,
        selectedQualities,
        // Upload progress callback
        (progress: UploadProgress[]) => {
          setUploadProgress(progress);
          console.log('📊 Upload progress:', progress);
        },
        // Processing progress callback
        (progress: BackendProcessingProgress) => {
          console.log('📊 ========== PROGRESS CALLBACK ==========');
          console.log('   Received from backendVideoUploader:');
          console.log('     - progress:', progress.progress + '%');
          console.log('     - currentStep:', progress.currentStep);
          console.log('     - stepProgress:', progress.stepProgress);
          console.log('     - segmentsUploaded:', progress.segmentsUploaded);
          console.log('     - totalSegments:', progress.totalSegments);
          console.log('     - message:', progress.message);
          console.log('     - status:', progress.status);
          console.log('========================================');
          
          // Convert BackendProcessingProgress to ProcessingStatus
          const status: ProcessingStatus = {
            lessonId: progress.lessonId,
            status: progress.status,
            progress: progress.progress,
            currentQuality: progress.currentQuality,
            qualityProgress: progress.qualityProgress,
            message: progress.message,
            error: progress.error,
            videoUrls: progress.videoUrls,
            thumbnailUrl: progress.thumbnailUrl,
            // NEW: Pass step data from Redis
            currentStep: progress.currentStep,
            stepProgress: progress.stepProgress,
            segmentsUploaded: progress.segmentsUploaded,
            totalSegments: progress.totalSegments,
          };
          
          console.log('📊 ========== SETTING PROCESSING STATUS ==========');
          console.log('   Status object:', JSON.stringify(status, null, 2));
          console.log('========================================');
          
          setProcessingStatus(status);

          // Show notifications for key status changes
          if (status.status === 'processing' && status.progress === 10) {
            info('Processing Started', 'Video processing has begun');
          } else if (status.status === 'complete') {
            console.log('✅ Processing complete!');
            console.log('   NEW lessonId (MongoDB ObjectID):', newLessonId);
            console.log('   Video URLs (HLS playlists):', status.videoUrls);
            console.log('   Thumbnail:', status.thumbnailUrl);
            console.log('   Master Playlist:', (status as any).masterPlaylistUrl);
            console.log('   Metadata:', videoMetadata);
            
            // CRITICAL FIX: Only check for videoUrls if they're provided
            // Redis progress might not have them, but fetchFinalVideoUrls will provide them
            if (status.videoUrls && Object.keys(status.videoUrls).length > 0) {
              console.log('📤 Calling onComplete with data...');
              
              success(
                'Processing Complete!',
                `Video processed successfully with ${Object.keys(status.videoUrls).length} quality version(s)`
              );
              
              const dataToPass = {
                videoUrls: status.videoUrls,
                thumbnailUrl: status.thumbnailUrl,
                masterPlaylistUrl: (status as any).masterPlaylistUrl,
                metadata: videoMetadata || undefined,
                videoType: 'UPLOAD' as const,
              };
              
              console.log('📦 Data being passed to onComplete:', JSON.stringify(dataToPass, null, 2));
              onComplete(dataToPass);
            } else {
              console.log('⏳ Waiting for fetchFinalVideoUrls to provide video URLs...');
            }
          } else if (status.status === 'error') {
            console.error('❌ Processing error:', status.error);
            showError('Processing Failed', status.error || 'An error occurred during processing');
          }
        },
        courseId, // Pass courseId for upload lock
        moduleName, // Pass moduleName for Redis display
        moduleId // NEW: Pass moduleId for lesson creation
      );

      console.log('✅ Upload initiated successfully');
      console.log('   NEW lessonId (MongoDB ObjectID):', newLessonId);
      console.log('   jobId:', jobId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start upload';
      console.error('❌ Failed to start upload:', err);
      setError(errorMsg);
      showError('Upload Failed', errorMsg);
      setStep('quality-select');
      
      // Release lock on error if courseId is provided
      if (courseId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/cancel/${courseId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'admin1' }), // TODO: Get from auth context
          });
        } catch (releaseError) {
          console.error('Failed to release lock:', releaseError);
        }
      }
    }
  };

  const handleCancel = async () => {
    console.log('🚫 User cancelled video upload');
    
    // Release lock if courseId is provided
    if (courseId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/cancel/${courseId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'admin1' }), // TODO: Get from auth context
        });
      } catch (releaseError) {
        console.error('Failed to release lock:', releaseError);
      }
    }
    
    onCancel();
  };

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('Invalid YouTube URL');
      showError('Invalid URL', 'Please enter a valid YouTube URL');
      return;
    }

    console.log('📺 YouTube URL validated:', youtubeUrl);
    success('YouTube Video Ready', 'YouTube video will be saved when you publish the course');

    // Call onComplete with YouTube data (don't save to backend yet)
    onComplete({
      videoType: 'YOUTUBE',
      youtubeUrl: youtubeUrl.trim(),
    });
  };

  return (
    <>
      {/* Upload Step */}
      {step === 'upload' && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Video
          </h3>

          {/* Upload Type Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUploadType('upload')}
              className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                uploadType === 'upload'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📁</div>
                <div className="font-medium">Upload Video</div>
                <div className="text-sm text-gray-500">Upload from your device</div>
              </div>
            </button>
            
            <button
              onClick={() => setUploadType('youtube')}
              className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                uploadType === 'youtube'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📺</div>
                <div className="font-medium">YouTube Link</div>
                <div className="text-sm text-gray-500">Embed from YouTube</div>
              </div>
            </button>
          </div>

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

          {uploading && uploadType === 'upload' && (
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

          {uploadType === 'upload' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL *
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={uploading}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Paste the YouTube video URL here
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleYouTubeSubmit}
                  disabled={uploading || !youtubeUrl.trim()}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Adding...' : 'Add YouTube Video'}
                </button>
              </div>
            </>
          )}
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
          // NEW: Pass step data from Redis
          currentStep={(processingStatus as any).currentStep}
          stepProgress={(processingStatus as any).stepProgress}
          segmentsUploaded={(processingStatus as any).segmentsUploaded}
          totalSegments={(processingStatus as any).totalSegments}
        />
      )}
      
      {/* Processing Step - Fallback if processingStatus is not set yet */}
      {step === 'processing' && !processingStatus && (
        <ProcessingProgress
          status="connecting"
          progress={0}
          message="Initializing..."
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

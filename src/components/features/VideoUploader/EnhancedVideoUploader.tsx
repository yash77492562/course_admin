'use client';

import { useState, useRef } from 'react';
import { backendVideoUploader, UploadProgress, ProcessingProgress } from '@/lib/video/backendVideoUploader';

export interface EnhancedVideoUploadData {
  type: 'upload' | 'youtube';
  title: string;
  description?: string;
  videoUrl?: string;
  lessonId?: string; // Optional - may not exist yet in course editor
}

interface EnhancedVideoUploaderProps {
  onVideoSelect: (data: EnhancedVideoUploadData) => void;
  onCancel: () => void;
  lessonId?: string; // Optional - may not exist yet in course editor
}

export function EnhancedVideoUploader({ onVideoSelect, onCancel, lessonId }: EnhancedVideoUploaderProps) {
  const [uploadType, setUploadType] = useState<'upload' | 'youtube'>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<{
    width: number;
    height: number;
    duration: number;
    availableQualities: string[];
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setVideoAnalysis(null);
    setSelectedFile(file);
    setAnalyzing(true);

    try {
      // Analyze video quality using backend uploader
      const analysis = await backendVideoUploader.analyzeVideo(file);
      
      if (!analysis.canProcess) {
        setError(analysis.error || 'Video quality is too low');
        setSelectedFile(null);
        return;
      }

      setVideoAnalysis({
        width: analysis.width,
        height: analysis.height,
        duration: analysis.duration,
        availableQualities: analysis.availableQualities,
      });

      // Auto-fill title if empty
      if (!title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }
    } catch (err) {
      console.error('Failed to analyze video:', err);
      setError('Failed to analyze video quality. Please try again.');
      setSelectedFile(null);
    } finally {
      setAnalyzing(false);
    }
  };



  const handleUpload = async () => {
    if (uploadType === 'youtube') {
      if (!youtubeUrl.trim() || !title.trim()) {
        alert('Please provide both YouTube URL and title');
        return;
      }

      onVideoSelect({
        type: 'youtube',
        title: title.trim(),
        description: description.trim(),
        videoUrl: youtubeUrl.trim(),
        lessonId,
      });
      return;
    }

    if (!selectedFile || !title.trim() || !videoAnalysis) {
      alert('Please select a valid video file and provide a title');
      return;
    }

    // If no lessonId, just return the data without uploading
    // The parent component will handle creating the lesson first
    if (!lessonId) {
      onVideoSelect({
        type: 'upload',
        title: title.trim(),
        description: description.trim(),
        lessonId: undefined,
      });
      return;
    }

    // Start uploading - show progress immediately
    setUploading(true);
    setError(null);

    try {
      // Upload video to backend for processing (ALL qualities in PARALLEL)
      await backendVideoUploader.uploadVideo(
        selectedFile,
        lessonId,
        title.trim(),
        videoAnalysis.availableQualities,
        (progressArray) => {
          // Upload progress
          setUploadProgress(progressArray);
        },
        (progress) => {
          // Processing progress
          setProcessingProgress(progress);
          
          // Only call onVideoSelect when COMPLETE
          if (progress.status === 'complete') {
            // Success! Video is processed and saved to database
            onVideoSelect({
              type: 'upload',
              title: title.trim(),
              description: description.trim(),
              lessonId,
            });
          } else if (progress.status === 'error') {
            // Error occurred
            setError(progress.error || 'Processing failed');
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Video upload failed:', error);
      setError(`Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploading(false);
      setUploadProgress([]);
      setProcessingProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Type Selection */}
      <div className="flex space-x-4">
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

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lesson Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter lesson title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter lesson description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Upload Type Specific Content */}
      {uploadType === 'upload' ? (
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {selectedFile ? (
                <div>
                  <div className="text-green-600 text-4xl mb-2">✓</div>
                  <div className="font-medium text-gray-900">{selectedFile.name}</div>
                  <div className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                  <button className="mt-2 text-blue-600 hover:text-blue-800">
                    Choose Different File
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-4xl mb-2">📁</div>
                  <div className="font-medium text-gray-900">Choose video file</div>
                  <div className="text-sm text-gray-500">
                    Supported formats: MP4, WebM, AVI, MOV
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Quality Analysis Display */}
          {analyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <div className="text-blue-600 text-xl animate-pulse">🔍</div>
                <div className="text-sm font-medium text-blue-900">
                  Analyzing video quality...
                </div>
              </div>
            </div>
          )}

          {videoAnalysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <div className="text-blue-600 text-xl">✓</div>
                <div>
                  <div className="font-medium text-blue-900">Video Quality Analysis</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Source: {videoAnalysis.width}x{videoAnalysis.height}
                  </div>
                  <div className="text-sm text-blue-700">
                    Duration: {Math.floor(videoAnalysis.duration / 60)}:{String(Math.floor(videoAnalysis.duration % 60)).padStart(2, '0')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-blue-900">
                  Will create {videoAnalysis.availableQualities.length} quality version{videoAnalysis.availableQualities.length > 1 ? 's' : ''}:
                </div>
                
                {videoAnalysis.availableQualities.map((quality) => (
                  <div
                    key={quality}
                    className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-green-600">✓</div>
                      <div className="font-medium text-green-900">{quality}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-blue-600">
                💡 Processing will happen on the server (parallel processing for all qualities)
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start space-x-2">
                <div className="text-red-600 text-xl">✗</div>
                <div>
                  <div className="font-medium text-red-900">Cannot Process Video</div>
                  <div className="text-sm text-red-700 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
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
          />
          <div className="mt-1 text-xs text-gray-500">
            Paste the YouTube video URL here
          </div>
        </div>
      )}

      {/* Upload Progress - Show ALL qualities */}
      {uploading && uploadProgress.length > 0 && !processingProgress && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900">Uploading chunks to server...</div>
          {uploadProgress.map((progress) => (
            <div key={progress.quality} className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Uploading {progress.quality} - {progress.status}
                </span>
                <span className="text-sm text-blue-700">
                  {progress.progress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-blue-600">
                Chunks: {progress.chunksUploaded}/{progress.totalChunks}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processing Progress - Show ALL qualities with real-time updates */}
      {uploading && processingProgress && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {processingProgress.status === 'analyzing' && '🔍 Analyzing video...'}
                  {processingProgress.status === 'processing' && '⚙️ Processing video...'}
                  {processingProgress.status === 'uploading' && '☁️ Uploading to cloud...'}
                  {processingProgress.status === 'complete' && '✅ Complete!'}
                  {processingProgress.status === 'error' && '❌ Error'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {processingProgress.message}
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {processingProgress.progress}%
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  processingProgress.status === 'complete' ? 'bg-green-500' :
                  processingProgress.status === 'error' ? 'bg-red-500' :
                  'bg-blue-600'
                }`}
                style={{ width: `${processingProgress.progress}%` }}
              ></div>
            </div>

            {/* Individual Quality Progress */}
            {processingProgress.qualityProgress && processingProgress.qualityProgress.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Quality Processing:</div>
                {processingProgress.qualityProgress.map((qp) => (
                  <div key={qp.quality} className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{qp.quality}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          qp.status === 'complete' ? 'bg-green-100 text-green-700' :
                          qp.status === 'error' ? 'bg-red-100 text-red-700' :
                          qp.status === 'uploading' ? 'bg-purple-100 text-purple-700' :
                          qp.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {qp.status === 'pending' && 'Pending'}
                          {qp.status === 'processing' && 'Processing'}
                          {qp.status === 'uploading' && 'Uploading'}
                          {qp.status === 'complete' && 'Complete'}
                          {qp.status === 'error' && 'Error'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{qp.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          qp.status === 'complete' ? 'bg-green-500' :
                          qp.status === 'error' ? 'bg-red-500' :
                          qp.status === 'uploading' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${qp.progress}%` }}
                      ></div>
                    </div>
                    {qp.error && (
                      <div className="mt-2 text-xs text-red-600">{qp.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {processingProgress.status === 'complete' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  ✅ Video processed successfully and saved to database!
                </div>
              </div>
            )}

            {processingProgress.status === 'error' && processingProgress.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-800">
                  ❌ {processingProgress.error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || analyzing || !title.trim() || (uploadType === 'upload' && (!selectedFile || !videoAnalysis)) || (uploadType === 'youtube' && !youtubeUrl.trim())}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : uploadType === 'upload' ? 'Upload & Process' : 'Add Video'}
        </button>
      </div>
    </div>
  );
}
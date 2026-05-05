'use client';

import { useState, useEffect } from 'react';

interface UploadInfo {
  courseId: string;
  lessonId: string;
  videoId?: string;
  jobId?: string;
  fileName?: string;
  uploadedBy: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  message: string;
  updatedAt: string;
  queuePosition?: number | null; // null = active/processing, number = waiting in queue
  moduleName?: string; // NEW: Module name for display
  lessonName?: string; // NEW: Lesson name for display
}

export function GlobalUploadStatus() {
  const [uploads, setUploads] = useState<UploadInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); // NEW: Collapsed by default

  // Fetch all active uploads
  const fetchActiveUploads = async () => {
    try {
      const response = await fetch('/api/upload/active');
      const data = await response.json();

      if (data.uploads) {
        setUploads(data.uploads);
        
        // Auto-expand when uploads start
        if (data.uploads.length > 0 && !isExpanded) {
          setIsExpanded(true);
        }
        
        // Auto-collapse when all uploads complete
        const hasActiveUploads = data.uploads.some(
          (u: UploadInfo) => u.status === 'uploading' || u.status === 'processing'
        );
        if (!hasActiveUploads && isExpanded) {
          // Wait 3 seconds before auto-collapsing
          setTimeout(() => {
            setIsExpanded(false);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error fetching active uploads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll every 2 seconds
  useEffect(() => {
    fetchActiveUploads();

    const interval = setInterval(() => {
      fetchActiveUploads();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return null;
  }

  if (uploads.length === 0) {
    return null;
  }

  // Minimized circle view
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center group"
        >
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
          
          {/* Icon */}
          <div className="relative z-10 flex flex-col items-center">
            <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-[10px] font-semibold">LIVE</span>
          </div>
          
          {/* Upload count badge */}
          {uploads.length > 1 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
              {uploads.length}
            </div>
          )}
        </button>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              <h3 className="text-white font-semibold text-sm">
                Active Uploads ({uploads.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-xs opacity-90">Live</span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Upload List */}
        <div className="max-h-96 overflow-y-auto">
          {uploads.map((upload, index) => (
            <div
              key={`${upload.courseId}-${upload.lessonId}-${index}`}
              className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              {/* File Info */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  {/* Show module and lesson name if available */}
                  {upload.moduleName && (
                    <p className="text-xs font-semibold text-blue-700 truncate">
                      📚 {upload.moduleName}
                    </p>
                  )}
                  {upload.lessonName && (
                    <p className="text-xs text-gray-700 truncate mt-0.5">
                      📹 {upload.lessonName}
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-900 truncate mt-1">
                    {upload.fileName || 'Video Upload'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Course: {upload.courseId.substring(0, 8)}...
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {/* Show queue position if waiting */}
                  {upload.queuePosition && upload.queuePosition > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Pending ({upload.queuePosition})
                    </span>
                  ) : upload.status === 'processing' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Processing
                    </span>
                  ) : upload.status === 'uploading' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Uploading
                    </span>
                  ) : upload.status === 'completed' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="capitalize">{upload.stage?.replace(/_/g, ' ') || 'Starting...'}</span>
                  <span className="font-medium">{upload.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      upload.status === 'failed'
                        ? 'bg-red-500'
                        : upload.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              <p className="text-xs text-gray-500 mb-1">{upload.message}</p>

              {/* Uploaded By */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>By: {upload.uploadedBy}</span>
                <span>{new Date(upload.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2 text-center">
          <p className="text-xs text-gray-500">
            Updates every 2 seconds • All admins see this
          </p>
        </div>
      </div>
    </div>
  );
}

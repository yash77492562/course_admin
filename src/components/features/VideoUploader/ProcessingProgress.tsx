'use client';

interface QualityProgress {
  quality: string;
  status: 'pending' | 'processing' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

interface ProcessingProgressProps {
  status: 'queued' | 'analyzing' | 'processing' | 'uploading' | 'complete' | 'error';
  progress: number;
  queuePosition?: number;
  currentQuality?: string;
  qualityProgress?: QualityProgress[];
  message?: string;
  error?: string;
  onPublish?: () => void;
  onCancel?: () => void;
}

export function ProcessingProgress({
  status,
  progress,
  queuePosition,
  currentQuality,
  qualityProgress = [],
  message,
  error,
  onPublish,
  onCancel
}: ProcessingProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'processing':
      case 'uploading': return 'text-blue-600';
      case 'queued': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
      case 'uploading':
        return (
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Video Processing
            </h3>
            {status === 'complete' && onCancel && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Queue Status */}
          {status === 'queued' && queuePosition && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Video Queued for Processing
                  </p>
                  <p className="text-sm text-yellow-800">
                    Position in queue: {queuePosition}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                {status === 'queued' && 'Waiting in queue...'}
                {status === 'analyzing' && 'Analyzing video...'}
                {status === 'processing' && `Processing ${currentQuality || 'video'}...`}
                {status === 'uploading' && 'Uploading to storage...'}
                {status === 'complete' && 'Processing complete!'}
                {status === 'error' && 'Processing failed'}
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  status === 'error' ? 'bg-red-500' :
                  status === 'complete' ? 'bg-green-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {message && (
              <p className="text-sm text-gray-600 mt-2">{message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-900">{error}</span>
              </div>
            </div>
          )}

          {/* Quality Progress */}
          {qualityProgress.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-medium text-gray-700">Quality Processing Status</h4>
              {qualityProgress.map((qp) => (
                <div key={qp.quality} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(qp.status)}
                      <span className="font-medium text-gray-900">{qp.quality}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        qp.status === 'complete' ? 'bg-green-100 text-green-800' :
                        qp.status === 'error' ? 'bg-red-100 text-red-800' :
                        qp.status === 'processing' || qp.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {qp.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{qp.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        qp.status === 'error' ? 'bg-red-500' :
                        qp.status === 'complete' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${qp.progress}%` }}
                    ></div>
                  </div>
                  {qp.error && (
                    <p className="text-xs text-red-600 mt-2">{qp.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Success Message */}
          {status === 'complete' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-900">
                  Video processed and uploaded to R2 successfully!
                </span>
              </div>
              <p className="text-sm text-green-800 ml-7">
                The video will be saved to the database when you publish the course.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'complete' && onPublish && (
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onPublish}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Continue Editing
              </button>
            </div>
          )}

          {status === 'error' && onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

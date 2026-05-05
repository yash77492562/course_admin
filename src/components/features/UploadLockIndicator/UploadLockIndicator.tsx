import { useEffect } from 'react';
import { useUploadStatus } from '../../../hooks/useUploadStatus';

interface UploadLockIndicatorProps {
  courseId: string;
  onLockStatusChange?: (isLocked: boolean) => void;
}

export function UploadLockIndicator({
  courseId,
  onLockStatusChange,
}: UploadLockIndicatorProps) {
  const { status, isLoading } = useUploadStatus(courseId);

  // Notify parent component of lock status changes
  useEffect(() => {
    if (onLockStatusChange) {
      onLockStatusChange(status.isLocked);
    }
  }, [status.isLocked, onLockStatusChange]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
        <span>Checking upload status...</span>
      </div>
    );
  }

  if (!status.isLocked) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {status.queuePosition && status.queuePosition > 0 ? (
            <svg
              className="h-5 w-5 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {status.queuePosition && status.queuePosition > 0
              ? `Queued - Position ${status.queuePosition}`
              : 'Upload in Progress'}
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            {/* Show module and lesson name if available */}
            {(status as any).moduleName && (
              <span className="block font-medium text-yellow-900">
                📚 {(status as any).moduleName}
              </span>
            )}
            {(status as any).lessonName && (
              <span className="block text-xs text-yellow-700 mt-0.5">
                📹 {(status as any).lessonName}
              </span>
            )}
            {status.fileName && (
              <span className="block font-medium mt-1">{status.fileName}</span>
            )}
            {status.message && (
              <span className="block mt-1">{status.message}</span>
            )}
            {status.queuePosition && status.queuePosition > 0 && (
              <span className="block mt-1 text-xs">
                Waiting for {status.queuePosition - 1} other upload{status.queuePosition > 2 ? 's' : ''} to complete
              </span>
            )}
          </p>

          {/* Progress Bar - Only show if not in queue */}
          {(!status.queuePosition || status.queuePosition === 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-yellow-700 mb-1">
                <span className="capitalize">{status.stage ? status.stage.replace(/_/g, ' ') : status.status}</span>
                <span>{status.progress}%</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="mt-2 text-xs text-yellow-600">
            {status.uploadedBy && (
              <span>Uploaded by: {status.uploadedBy}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

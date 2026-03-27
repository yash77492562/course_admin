'use client';

import { useState } from 'react';

export interface QualityOption {
  value: string;
  label: string;
  enabled: boolean;
  recommended?: boolean;
}

interface QualitySelectorProps {
  availableQualities: string[];
  onConfirm: (selectedQualities: string[]) => void;
  onCancel: () => void;
  videoMetadata?: {
    width: number;
    height: number;
    duration: number;
  };
  error?: string;
}

export function QualitySelector({
  availableQualities,
  onConfirm,
  onCancel,
  videoMetadata,
  error
}: QualitySelectorProps) {
  // Initialize with all qualities selected
  const [selectedQualities, setSelectedQualities] = useState<Set<string>>(
    new Set(availableQualities)
  );

  const qualityOptions: QualityOption[] = [
    { value: '460p', label: '460p (SD)', enabled: availableQualities.includes('460p') },
    { value: '720p', label: '720p (HD)', enabled: availableQualities.includes('720p'), recommended: true },
    { value: '1080p', label: '1080p (Full HD)', enabled: availableQualities.includes('1080p') },
  ];

  const toggleQuality = (quality: string) => {
    const newSelected = new Set(selectedQualities);
    if (newSelected.has(quality)) {
      newSelected.delete(quality);
    } else {
      newSelected.add(quality);
    }
    setSelectedQualities(newSelected);
  };

  const handleProceed = () => {
    if (selectedQualities.size === 0) {
      return; // Don't proceed if no qualities selected
    }
    onConfirm(Array.from(selectedQualities));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Select Video Qualities
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Choose which quality versions to create for this video
          </p>

          {/* Video Metadata */}
          {videoMetadata && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Video Information</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Resolution: {videoMetadata.width} × {videoMetadata.height}</p>
                <p>Duration: {Math.round(videoMetadata.duration)}s</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-900">{error}</span>
              </div>
            </div>
          )}

          {/* Quality Options */}
          <div className="space-y-3 mb-6">
            {qualityOptions.map((option) => (
              <div
                key={option.value}
                className={`border rounded-lg p-4 transition-all ${
                  !option.enabled
                    ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                    : selectedQualities.has(option.value)
                    ? 'bg-blue-50 border-blue-500 cursor-pointer'
                    : 'bg-white border-gray-300 hover:border-blue-300 cursor-pointer'
                }`}
                onClick={() => option.enabled && toggleQuality(option.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        !option.enabled
                          ? 'border-gray-300 bg-gray-100'
                          : selectedQualities.has(option.value)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-400'
                      }`}
                    >
                      {selectedQualities.has(option.value) && option.enabled && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{option.label}</span>
                        {option.recommended && option.enabled && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      {!option.enabled && (
                        <span className="text-xs text-gray-500">Not available for this video</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selection Summary */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{selectedQualities.size}</span> quality version{selectedQualities.size !== 1 ? 's' : ''} selected
              {selectedQualities.size > 0 && (
                <span className="text-gray-500"> ({Array.from(selectedQualities).join(', ')})</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={selectedQualities.size === 0}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed ({selectedQualities.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

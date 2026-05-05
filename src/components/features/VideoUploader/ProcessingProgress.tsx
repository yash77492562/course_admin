'use client';

interface QualityProgress {
  quality: string;
  status: 'pending' | 'processing' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

interface ProcessingProgressProps {
  status: 'queued' | 'analyzing' | 'processing' | 'uploading' | 'complete' | 'error' | 'connecting' | 'heartbeat';
  progress: number;
  queuePosition?: number;
  currentQuality?: string;
  qualityProgress?: QualityProgress[];
  message?: string;
  error?: string;
  onPublish?: () => void;
  onCancel?: () => void;
  // NEW: Step data from Redis
  currentStep?: number;
  stepProgress?: number;
  segmentsUploaded?: number;
  totalSegments?: number;
}

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Chunks',
    description: 'In Memory',
    icon: '📦',
  },
  {
    number: 2,
    title: 'Processing',
    description: 'Transcoding',
    icon: '🎞️',
  },
  {
    number: 3,
    title: 'Transfer to R2',
    description: 'Uploading',
    icon: '☁️',
  },
  {
    number: 4,
    title: 'Database',
    description: 'Updating',
    icon: '💾',
  },
  {
    number: 5,
    title: 'Cleanup',
    description: 'Finalizing',
    icon: '🧹',
  },
];

export function ProcessingProgress({
  status,
  progress,
  queuePosition,
  currentQuality,
  qualityProgress = [],
  message,
  error,
  onPublish,
  onCancel,
  // NEW: Step data from Redis
  currentStep: redisCurrentStep,
  stepProgress: redisStepProgress,
  segmentsUploaded,
  totalSegments,
}: ProcessingProgressProps) {
  // CRITICAL FIX: Use actual step data from Redis if available
  // Otherwise fallback to calculating from overall progress
  
  const parseStepInfo = (msg: string | undefined, prog: number) => {
    // If we have Redis step data, use it directly
    if (redisCurrentStep !== undefined && redisStepProgress !== undefined) {
      const segmentsInfo = segmentsUploaded && totalSegments 
        ? ` (${segmentsUploaded}/${totalSegments} segments)`
        : '';
      
      return {
        currentStep: redisCurrentStep,
        stepProgress: Math.round(redisStepProgress),
        segmentsInfo,
      };
    }
    
    // Fallback: Calculate from overall progress (old behavior)
    let currentStep = 1;
    let stepProgress = 0;
    let segmentsInfo = '';

    // Calculate from overall progress as fallback
    if (prog < 10) {
      currentStep = 1;
      stepProgress = (prog / 10) * 100;
    } else if (prog < 65) {
      currentStep = 2;
      stepProgress = ((prog - 10) / 55) * 100;
    } else if (prog < 85) {
      currentStep = 3;
      stepProgress = ((prog - 65) / 20) * 100;
      // Extract segment info from message if available
      if (msg && msg.includes('segment')) {
        const match = msg.match(/(\d+)\/(\d+)/);
        if (match) {
          segmentsInfo = ` (${match[1]}/${match[2]} segments)`;
        }
      }
    } else if (prog < 95) {
      currentStep = 4;
      stepProgress = ((prog - 85) / 10) * 100;
    } else if (prog < 100) {
      currentStep = 5;
      stepProgress = ((prog - 95) / 5) * 100;
    } else {
      currentStep = 5;
      stepProgress = 100;
    }

    return {
      currentStep,
      stepProgress: Math.round(stepProgress),
      segmentsInfo,
    };
  };

  const { currentStep, stepProgress, segmentsInfo } = parseStepInfo(message, progress);

  // Log for debugging
  console.log('🎨 ========== PROCESSING PROGRESS RENDER ==========');
  console.log('   Props Received:');
  console.log('     - progress:', progress + '%');
  console.log('     - redisCurrentStep:', redisCurrentStep);
  console.log('     - redisStepProgress:', redisStepProgress);
  console.log('     - segmentsUploaded:', segmentsUploaded);
  console.log('     - totalSegments:', totalSegments);
  console.log('     - message:', message);
  console.log('     - status:', status);
  console.log('   Calculated Values:');
  console.log('     - currentStep:', currentStep);
  console.log('     - stepProgress:', stepProgress + '%');
  console.log('     - segmentsInfo:', segmentsInfo);
  console.log('     - usingRedisData:', redisCurrentStep !== undefined);
  console.log('========================================');

  // Get step status
  const getStepStatus = (stepNumber: number): 'pending' | 'active' | 'complete' => {
    if (stepNumber < currentStep) return 'complete';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  // Get step progress percentage (0-100 for each step)
  const getStepProgress = (stepNumber: number): number => {
    if (stepNumber < currentStep) return 100;
    if (stepNumber === currentStep) return stepProgress;
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
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

          {/* Circular Progress Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const stepStatus = getStepStatus(step.number);
                const stepProg = getStepProgress(step.number);
                const isActive = stepStatus === 'active';
                const isComplete = stepStatus === 'complete';
                
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    {/* Step with Circular Progress */}
                    <div className="flex flex-col items-center">
                      {/* Circular Progress Loader */}
                      <div className="relative w-24 h-24">
                        {/* Background Circle */}
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className={isComplete ? 'text-green-200' : isActive ? 'text-blue-200' : 'text-gray-200'}
                          />
                          {/* Progress Circle */}
                          {(isActive || isComplete) && (
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - (isComplete ? 100 : stepProg) / 100)}`}
                              className={isComplete ? 'text-green-500' : 'text-blue-500'}
                              strokeLinecap="round"
                            />
                          )}
                        </svg>
                        
                        {/* Center Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isComplete ? (
                            <div className="text-green-500 text-3xl font-bold">✓</div>
                          ) : isActive ? (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{stepProg}%</div>
                              <div className="text-xs text-gray-500">{step.icon}</div>
                            </div>
                          ) : (
                            <div className="text-3xl text-gray-400">{step.icon}</div>
                          )}
                        </div>
                      </div>

                      {/* Step Info */}
                      <div className="mt-3 text-center">
                        <p className={`text-sm font-semibold ${
                          isActive ? 'text-blue-600' : 
                          isComplete ? 'text-green-600' : 
                          'text-gray-500'
                        }`}>
                          Step {step.number}
                        </p>
                        <p className={`text-xs font-medium ${
                          isActive ? 'text-blue-600' : 
                          isComplete ? 'text-green-600' : 
                          'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400">{step.description}</p>
                        {isActive && step.number === 3 && segmentsInfo && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            {segmentsInfo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Arrow Connector */}
                    {index < STEPS.length - 1 && (
                      <div className="flex-1 h-1 mx-4 mb-20">
                        <div className={`h-full transition-all duration-300 ${
                          isComplete ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Step Message */}
          {status === 'processing' && message && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{message}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Overall Progress: {progress}%
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Success Message */}
          {status === 'complete' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-900">
                  Video processed and uploaded successfully!
                </span>
              </div>
              <p className="text-sm text-green-800 ml-7">
                All steps completed. The video will be saved to the database when you publish the course.
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

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VideoPlayerWrapper = dynamic(
  () => import('@/components/features/VideoPlayer').then(mod => ({ default: mod.VideoPlayerWrapper })),
  { ssr: false }
);

const PDFViewerSimple = dynamic(
  () => import('@/components/features/LectureUploader/PDFViewerSimple').then(mod => ({ default: mod.PDFViewerSimple })),
  { ssr: false }
);

const QuizViewer = dynamic(
  () => import('@/components/features/QuizViewer/QuizViewer').then(mod => ({ default: mod.QuizViewer })),
  { ssr: false }
);

interface LessonData {
  id: string;
  title: string;
  description?: string;
  contentType: 'VIDEO' | 'PDF' | 'QUIZ';
  videoType?: 'UPLOAD' | 'YOUTUBE';
  videoUrl?: string;
  videoUrls?: Record<string, string>;
  hlsMasterPlaylist?: string;
  hlsQualities?: Record<string, string>;
  thumbnail?: string;
  pdfUrl?: string;
  pdfPassword?: string;
  quizData?: any;
  order: number;
  module: {
    id: string;
    title: string;
    order: number;
    course: {
      id: string;
      title: string;
      modules: Array<{
        id: string;
        title: string;
        order: number;
        lessons: Array<{
          id: string;
          title: string;
          order: number;
          contentType: 'VIDEO' | 'PDF' | 'QUIZ';
        }>;
      }>;
    };
    lessons: Array<{
      id: string;
      title: string;
      order: number;
    }>;
  };
  previousLesson?: { id: string; title: string } | null;
  nextLesson?: { id: string; title: string } | null;
}

export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonId = params.id as string;
  
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadLesson = async () => {
      try {
        // Fetch directly from backend API to get fresh proxy URLs
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${apiUrl}/lessons/${lessonId}`, {
          cache: 'no-store',
        });
        const result = await response.json();
        
        console.log('Backend API Response:', result);
        
        if (result.success && result.data) {
          console.log('Lesson Data Structure:', {
            hasModule: !!result.data.module,
            hasCourse: !!result.data.module?.course,
            hasModules: !!result.data.module?.course?.modules,
            moduleCount: result.data.module?.course?.modules?.length || 0
          });
          setLessonData(result.data);
          if (result.data.module?.id) {
            setExpandedModules(new Set([result.data.module.id]));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load lesson:', error);
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, searchParams]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const navigateToLesson = (newLessonId: string) => {
    router.push(`/video-player/${newLessonId}`);
  };

  const getAllLessonsInOrder = () => {
    if (!lessonData?.module?.course?.modules) return [];
    
    const allLessons: Array<{ id: string; moduleId: string; order: number; moduleOrder: number }> = [];
    
    lessonData.module.course.modules.forEach(module => {
      if (module.lessons) {
        module.lessons.forEach(lesson => {
          allLessons.push({
            id: lesson.id,
            moduleId: module.id,
            order: lesson.order,
            moduleOrder: module.order
          });
        });
      }
    });
    
    return allLessons.sort((a, b) => {
      if (a.moduleOrder !== b.moduleOrder) {
        return a.moduleOrder - b.moduleOrder;
      }
      return a.order - b.order;
    });
  };

  const handleNext = () => {
    if (!lessonData) return;
    
    const allLessons = getAllLessonsInOrder();
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      navigateToLesson(allLessons[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (!lessonData) return;
    
    const allLessons = getAllLessonsInOrder();
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    
    if (currentIndex > 0) {
      navigateToLesson(allLessons[currentIndex - 1].id);
    }
  };

  const hasNext = () => {
    if (!lessonData) return false;
    
    const allLessons = getAllLessonsInOrder();
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    
    return currentIndex >= 0 && currentIndex < allLessons.length - 1;
  };

  const hasPrevious = () => {
    if (!lessonData) return false;
    
    const allLessons = getAllLessonsInOrder();
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    
    return currentIndex > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading content...</div>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">Content not available</div>
      </div>
    );
  }

  console.log('Lesson Data:', lessonData);
  console.log('Content Type:', lessonData.contentType);
  console.log('Has Module:', !!lessonData.module);
  console.log('Has Course:', !!lessonData.module?.course);
  console.log('Has Modules Array:', !!lessonData.module?.course?.modules);
  console.log('Modules Length:', lessonData.module?.course?.modules?.length);

  const contentType = lessonData.contentType || 'VIDEO';
  const hasFullNavigation = !!(lessonData.module?.course?.modules && lessonData.module.course.modules.length > 0);
  
  console.log('Has Full Navigation:', hasFullNavigation);

  if (!hasFullNavigation) {
    // QUIZ content
    if (contentType === 'QUIZ') {
      if (!lessonData.quizData) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-4">No quiz available</div>
              <div className="text-gray-600 text-sm">This lesson does not have quiz questions yet.</div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <QuizViewer
            quizData={lessonData.quizData}
            title={lessonData.title}
            onComplete={(score, total) => {
              console.log(`Quiz completed: ${score}/${total}`);
            }}
          />
        </div>
      );
    }

    // PDF content
    if (contentType === 'PDF') {
      if (!lessonData.pdfUrl) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">No PDF available</div>
              <div className="text-gray-400 text-sm">This lesson does not have a PDF uploaded yet.</div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-screen bg-gray-900">
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <h1 className="text-white text-xl font-semibold">{lessonData.title}</h1>
          </div>
          <div className="flex-1 bg-white overflow-hidden">
            <PDFViewerSimple
              pdfUrl={lessonData.pdfUrl}
              password={lessonData.pdfPassword}
              title={lessonData.title}
            />
          </div>
        </div>
      );
    }

    const isYouTube = lessonData.videoType === 'YOUTUBE';
    const hasHLS = lessonData.hlsMasterPlaylist || (lessonData.hlsQualities && Object.keys(lessonData.hlsQualities).length > 0);
    const hasMP4 = lessonData.videoUrls && Object.keys(lessonData.videoUrls).length > 0;
    
    if (isYouTube && !lessonData.videoUrl) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">No YouTube URL available</div>
            <div className="text-gray-400 text-sm">Please add the YouTube URL from the course editor.</div>
          </div>
        </div>
      );
    }
    
    if (!isYouTube && !hasHLS && !hasMP4) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-xl mb-4">No video source available</div>
            <div className="text-gray-400 text-sm mb-4">
              This lesson was created but the video was never uploaded or processing failed.
            </div>
            <div className="text-gray-500 text-xs">
              <p className="mb-2">To fix this:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>Go back to the course editor</li>
                <li>Delete this lesson and create a new one with a video</li>
                <li>Or upload a video for this lesson</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h1 className="text-white text-xl font-semibold">{lessonData.title}</h1>
        </div>
        <div className="flex-1 bg-black flex items-center justify-center p-6">
          <div className="w-full max-w-6xl">
            <VideoPlayerWrapper
              videoType={lessonData.videoType || 'UPLOAD'}
              hlsMasterPlaylist={lessonData.hlsMasterPlaylist}
              hlsQualities={lessonData.hlsQualities}
              videoUrls={lessonData.videoUrls}
              videoUrl={lessonData.videoUrl}
              thumbnail={lessonData.thumbnail}
              title={lessonData.title}
              autoplay={false}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>
        {lessonData.description && (
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <p className="text-gray-300">{lessonData.description}</p>
          </div>
        )}
      </div>
    );
  }

  if (contentType === 'PDF') {
    if (!lessonData.pdfUrl) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">No PDF available</div>
            <div className="text-gray-400 text-sm">This lesson does not have a PDF uploaded yet.</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-gray-900">
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-white text-lg font-semibold mb-4">
              {lessonData.module.course.title}
            </h2>
            
            <div className="space-y-2">
              {lessonData.module.course.modules
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <div key={module.id} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full px-4 py-3 bg-gray-750 hover:bg-gray-700 text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-white font-medium text-sm">{module.title}</span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules.has(module.id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedModules.has(module.id) && module.lessons && (
                      <div className="bg-gray-800">
                        {module.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => navigateToLesson(lesson.id)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${lesson.id === lessonId ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{lesson.contentType === 'QUIZ' ? '📝' : lesson.contentType === 'PDF' ? '📄' : '🎥'}</span>
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-white text-xl font-semibold">{lessonData.title}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious()}
                  className={`px-4 py-2 rounded-lg transition-colors ${hasPrevious() ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  &larr; Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext()}
                  className={`px-4 py-2 rounded-lg transition-colors ${hasNext() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white overflow-hidden">
            <PDFViewerSimple
              pdfUrl={lessonData.pdfUrl}
              password={lessonData.pdfPassword}
              title={lessonData.title}
            />
          </div>
        </div>
      </div>
    );
  }

  // QUIZ content with navigation
  if (contentType === 'QUIZ') {
    if (!lessonData.quizData) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">No quiz available</div>
            <div className="text-gray-600 text-sm">This lesson does not have quiz questions yet.</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-gray-900">
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-white text-lg font-semibold mb-4">
              {lessonData.module.course.title}
            </h2>
            
            <div className="space-y-2">
              {lessonData.module.course.modules
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <div key={module.id} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full px-4 py-3 bg-gray-750 hover:bg-gray-700 text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-white font-medium text-sm">{module.title}</span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules.has(module.id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedModules.has(module.id) && module.lessons && (
                      <div className="bg-gray-800">
                        {module.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => navigateToLesson(lesson.id)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${lesson.id === lessonId ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{lesson.contentType === 'QUIZ' ? '📝' : lesson.contentType === 'PDF' ? '📄' : '🎥'}</span>
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-white text-xl font-semibold">{lessonData.title}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious()}
                  className={`px-4 py-2 rounded-lg transition-colors ${hasPrevious() ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  &larr; Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext()}
                  className={`px-4 py-2 rounded-lg transition-colors ${hasNext() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 py-8">
            <QuizViewer
              quizData={lessonData.quizData}
              title={lessonData.title}
              onComplete={(score, total) => {
                console.log(`Quiz completed: ${score}/${total}`);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // VIDEO content
  const isYouTube = lessonData.videoType === 'YOUTUBE';
  const hasHLS = lessonData.hlsMasterPlaylist || (lessonData.hlsQualities && Object.keys(lessonData.hlsQualities).length > 0);
  const hasMP4 = lessonData.videoUrls && Object.keys(lessonData.videoUrls).length > 0;
  
  if (isYouTube && !lessonData.videoUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">No YouTube URL available</div>
          <div className="text-gray-400 text-sm">Please add the YouTube URL from the course editor.</div>
        </div>
      </div>
    );
  }
  
  if (!isYouTube && !hasHLS && !hasMP4) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">No video source available</div>
          <div className="text-gray-400 text-sm">Please upload and publish the video from the course editor.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {lessonData.module?.course?.modules && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-white text-lg font-semibold mb-4">
              {lessonData.module.course.title}
            </h2>
            
            <div className="space-y-2">
              {lessonData.module.course.modules
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <div key={module.id} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full px-4 py-3 bg-gray-750 hover:bg-gray-700 text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-white font-medium text-sm">{module.title}</span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules.has(module.id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedModules.has(module.id) && module.lessons && (
                      <div className="bg-gray-800">
                        {module.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => navigateToLesson(lesson.id)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${lesson.id === lessonId ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{lesson.contentType === 'QUIZ' ? '📝' : lesson.contentType === 'PDF' ? '📄' : '🎥'}</span>
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-semibold">{lessonData.title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious()}
                className={`px-4 py-2 rounded-lg transition-colors ${hasPrevious() ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                &larr; Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext()}
                className={`px-4 py-2 rounded-lg transition-colors ${hasNext() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black flex items-center justify-center p-6">
          <div className="w-full max-w-6xl">
            <VideoPlayerWrapper
              videoType={lessonData.videoType || 'UPLOAD'}
              hlsMasterPlaylist={lessonData.hlsMasterPlaylist}
              hlsQualities={lessonData.hlsQualities}
              videoUrls={lessonData.videoUrls}
              videoUrl={lessonData.videoUrl}
              thumbnail={lessonData.thumbnail}
              title={lessonData.title}
              autoplay={false}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>

        {lessonData.description && (
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <p className="text-gray-300">{lessonData.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
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

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/lessons/${lessonId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch lesson: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('📚 Lesson data loaded:', result.data);
          setLessonData(result.data);
        } else {
          setError('Lesson not found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load lesson:', err);
        setError('Failed to load lesson');
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading lesson...</div>
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || 'Lesson not available'}</div>
      </div>
    );
  }

  const contentType = lessonData.contentType || 'VIDEO';

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8">
        {/* Content Container */}
        <div className="w-full max-w-6xl mx-auto">
          {contentType === 'QUIZ' && lessonData.quizData ? (
            // Quiz Viewer
            <div className="bg-white rounded-lg overflow-hidden">
              <QuizViewer
                quizData={lessonData.quizData}
                title={lessonData.title}
              />
            </div>
          ) : contentType === 'PDF' && lessonData.pdfUrl ? (
            // PDF Viewer
            <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '80vh' }}>
              <PDFViewerSimple
                pdfUrl={lessonData.pdfUrl}
                password={lessonData.pdfPassword}
                title={lessonData.title}
              />
            </div>
          ) : contentType === 'VIDEO' ? (
            // Video Player (YouTube or HLS)
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
          ) : (
            <div className="text-white text-center py-20">
              <div className="text-red-400 text-xl mb-4">Unknown content type</div>
              <div className="text-gray-400">This lesson has an unsupported content type.</div>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-white text-2xl font-bold mb-2">
            {lessonData.title}
          </h1>
          {lessonData.description && (
            <p className="text-gray-400">{lessonData.description}</p>
          )}
          
          {/* Content Type Badge */}
          <div className="mt-4 flex items-center gap-2">
            {contentType === 'QUIZ' && (
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                📝 Quiz
              </span>
            )}
            {contentType === 'PDF' && (
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                📄 PDF Lecture
              </span>
            )}
            {contentType === 'VIDEO' && lessonData.videoType === 'YOUTUBE' && (
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                📺 YouTube Video
              </span>
            )}
            {contentType === 'VIDEO' && lessonData.videoType === 'UPLOAD' && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                🎥 Uploaded Video
              </span>
            )}
          </div>

          {/* Video Metadata */}
          {contentType === 'VIDEO' && lessonData.videoType === 'UPLOAD' && lessonData.originalWidth && lessonData.originalHeight && (
            <p className="text-gray-500 text-sm mt-2">
              {lessonData.originalWidth}x{lessonData.originalHeight} • {Math.round(lessonData.videoDuration || 0)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

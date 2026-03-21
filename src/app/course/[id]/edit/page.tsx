'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CourseEditorPage } from '@/page-components/CourseEditor';
import { useCourses } from '@/hooks/useCourses';
import { Course, CourseStatus } from '@/types/course';
import { ClientOnly } from '@/components/features/hydration';
import { Loading, Error } from '@/components/ui';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { actions } = useCourses();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseId = params?.id as string;

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const result = await actions.getCourse(courseId);
      if (result.success && result.data) {
        setCourse(result.data);
      } else {
        setError(result.error || 'Failed to load course');
      }
    } catch (err) {
      console.error('Failed to load course:', err);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any, status: any) => {
    try {
      const result = await actions.updateCourse(courseId, { ...data, status });
      if (result.success) {
        router.push('/');
      }
      return result;
    } catch (error) {
      console.error('Failed to update course:', error);
      return { success: false, error: 'Failed to update course' };
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading course..." />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Error 
          title="Failed to load course"
          message={error || 'Course not found'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course editor...</p>
        </div>
      </div>
    }>
      <CourseEditorPage
        course={course}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </ClientOnly>
  );
}
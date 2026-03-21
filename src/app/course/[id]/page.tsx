'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Course } from '@/types/course';
import { courseApi } from '@/lib/courseApi/courseApi';
import { CourseDetailPage } from '@/page-components/CourseDetail';
import { ClientOnly } from '@/components/features/hydration';

export default function CourseDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseApi.getCourseById(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Failed to load course:', error);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (data: any) => {
    try {
      await courseApi.updateCourse(courseId, data);
      await loadCourse();
    } catch (error) {
      console.error('Failed to update course:', error);
      throw error;
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await courseApi.deleteCourse(courseId);
      router.push('/');
    } catch (error) {
      console.error('Failed to delete course:', error);
      throw error;
    }
  };

  const handleAddModule = async (moduleData: any) => {
    try {
      await courseApi.addModuleToCourse(courseId, moduleData);
      await loadCourse();
    } catch (error) {
      console.error('Failed to add module:', error);
      throw error;
    }
  };

  if (!course && !loading && !error) {
    return (
      <ClientOnly fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      {course && (
        <CourseDetailPage
          course={course}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onAddModule={handleAddModule}
          isLoading={loading}
          error={error}
        />
      )}
    </ClientOnly>
  );
}
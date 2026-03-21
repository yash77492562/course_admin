'use client';

import { useRouter } from 'next/navigation';
import { CourseEditorPage } from '@/page-components/CourseEditor';
import { useCourses } from '@/hooks/useCourses';
import { CourseStatus } from '@/types/course';
import { ClientOnly } from '@/components/features/hydration';

export default function NewCoursePage() {
  const router = useRouter();
  const { actions } = useCourses();

  const handleSave = async (data: any, status: any) => {
    try {
      const result = await actions.createCourse({ ...data, status });
      if (result.success) {
        router.push('/');
      }
      return result;
    } catch (error) {
      console.error('Failed to create course:', error);
      return { success: false, error: 'Failed to create course' };
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

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
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </ClientOnly>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import { useCourses } from '@/hooks/useCourses';
import { CourseManagementPage } from '@/page-components/CourseManagement';
import { ClientOnly } from '@/components/features/hydration';

export default function AdminDashboard() {
  const router = useRouter();
  const { courses, loading, error, actions } = useCourses();

  const handleCourseClick = (course: any) => {
    router.push(`/course/${course.id}`);
  };

  const handleCreateCourse = async (data: any) => {
    const result = await actions.createCourse(data);
    return result;
  };

  const handleUpdateCourse = async (id: string, data: any) => {
    const result = await actions.updateCourse(id, data);
    return result;
  };

  const handleDeleteCourse = async (id: string) => {
    const result = await actions.deleteCourse(id);
    return result;
  };

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <CourseManagementPage
        courses={courses}
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
        isLoading={loading}
        error={error}
      />
    </ClientOnly>
  );
}
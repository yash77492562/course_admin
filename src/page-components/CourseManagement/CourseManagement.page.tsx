'use client';

import { useState } from 'react';
import { Course } from '@/types/course';
import { AdminCourseCard } from '@/components/AdminCourseCard';
import { AddCourseCard } from '@/components/AddCourseCard';
import { Header } from '@/components/layout/Header';
import { Loading, Error, Alert } from '@/components/ui';

interface CourseManagementPageProps {
  courses: Course[];
  onCreateCourse: (data: any) => Promise<{ success: boolean; error?: string }>;
  onUpdateCourse: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  onDeleteCourse: (id: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  error?: string | null;
}

export function CourseManagementPage({
  courses,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  isLoading = false,
  error
}: CourseManagementPageProps) {
  const [successMessage, setSuccessMessage] = useState('');

  const handleCourseClick = (course: Course) => {
    // Navigate to course editor page
    window.location.href = `/course/${course.id}/edit`;
  };

  const handleCreateNewCourse = () => {
    // Navigate to course creation page
    window.location.href = '/course/new';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading courses..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Error 
          title="Failed to load courses"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Success Alert */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="relative">
            <Alert variant="success">
              {successMessage}
            </Alert>
            <button
              onClick={() => setSuccessMessage('')}
              className="absolute top-2 right-2 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Grid */}
        {courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AddCourseCard onClick={handleCreateNewCourse} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <AdminCourseCard
                key={course.id}
                course={course}
                onClick={() => handleCourseClick(course)}
              />
            ))}
            <AddCourseCard onClick={handleCreateNewCourse} />
          </div>
        )}
      </div>
    </div>
  );
}
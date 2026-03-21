import { useState, useEffect } from 'react';
import { Course, CreateCourseData } from '@/types/course';
import { courseApi } from '@/lib/courseApi/courseApi';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseApi.getAllCourses();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses. Please check if the backend is running.');
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (data: CreateCourseData) => {
    try {
      await courseApi.createCourse(data);
      await loadCourses(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Failed to create course:', err);
      return { success: false, error: 'Failed to create course' };
    }
  };

  const updateCourse = async (id: string, data: Partial<CreateCourseData>) => {
    try {
      await courseApi.updateCourse(id, data);
      await loadCourses(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Failed to update course:', err);
      return { success: false, error: 'Failed to update course' };
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await courseApi.deleteCourse(id);
      await loadCourses(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Failed to delete course:', err);
      return { success: false, error: 'Failed to delete course' };
    }
  };

  const getCourse = async (id: string) => {
    try {
      const data = await courseApi.getCourseById(id);
      return { success: true, data };
    } catch (err) {
      console.error('Failed to get course:', err);
      return { success: false, error: 'Failed to get course' };
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    drafts: courses.filter(c => c.status === 'DRAFT').length,
  };

  return {
    courses,
    loading,
    error,
    stats,
    actions: {
      loadCourses,
      createCourse,
      updateCourse,
      deleteCourse,
      getCourse,
    },
  };
}
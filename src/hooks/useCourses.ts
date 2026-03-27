import { useState, useEffect, useCallback } from 'react';
import { Course, CreateCourseData, CourseStatus } from '@/types/course';
import { PaginationParams, PaginatedResponse } from '@/types/pagination/pagination';
import { courseApi } from '@/lib/courseApi/courseApi';

interface UseCoursesOptions {
  enablePagination?: boolean;
  initialParams?: PaginationParams;
  onError?: (error: string) => void;
}

export function useCourses(options: UseCoursesOptions = {}) {
  const { enablePagination = false, initialParams, onError } = options;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Course>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async (params?: PaginationParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await courseApi.getAllCourses(enablePagination ? params : undefined);
      
      if (enablePagination && result && 'pagination' in result) {
        setCourses(Array.isArray(result.data) ? result.data : []);
        setPagination(result.pagination);
      } else {
        setCourses(Array.isArray(result) ? result : []);
        setPagination(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courses. Please check if the backend is running.';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Failed to load courses:', err);
      setCourses([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [enablePagination, onError]);

  const createCourse = async (data: CreateCourseData) => {
    try {
      console.log('🎯 useCourses: createCourse called');
      console.log('📦 Data:', JSON.stringify(data, null, 2));
      
      const result = await courseApi.createCourse(data);
      
      console.log('📡 API result:', result);
      
      if (result.success) {
        await loadCourses(initialParams); // Refresh the list
        return { success: true, data: result.data };
      } else {
        console.error('❌ API returned error:', result.error);
        onError?.(result.error || 'Failed to create course');
        return { success: false, error: result.error || 'Failed to create course' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course';
      console.error('❌ Exception in createCourse:', err);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateCourse = async (id: string, data: Partial<CreateCourseData>) => {
    try {
      await courseApi.updateCourse(id, data);
      await loadCourses(initialParams); // Refresh the list
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
      console.error('Failed to update course:', err);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await courseApi.deleteCourse(id);
      await loadCourses(initialParams); // Refresh the list
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
      console.error('Failed to delete course:', err);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getCourse = async (id: string) => {
    try {
      const data = await courseApi.getCourseById(id);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get course';
      console.error('Failed to get course:', err);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    loadCourses(initialParams);
  }, [loadCourses, initialParams]);

  const stats = {
    total: Array.isArray(courses) ? courses.length : 0,
    published: Array.isArray(courses) ? courses.filter(c => c.status === 'PUBLISHED').length : 0,
    drafts: Array.isArray(courses) ? courses.filter(c => c.status === 'DRAFT').length : 0,
  };

  return {
    courses,
    pagination,
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
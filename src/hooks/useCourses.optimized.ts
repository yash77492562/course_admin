import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../lib/api/courses';
import { Course, CreateCourseData } from '../types/course/course';

interface UseCoursesOptimizedOptions {
  enablePagination?: boolean;
  enableBackgroundRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
}

export const useCoursesOptimized = (options: UseCoursesOptimizedOptions = {}) => {
  const queryClient = useQueryClient();
  const {
    enablePagination = false,
    enableBackgroundRefresh = true,
    refreshInterval = 30000,
    onError,
  } = options;

  // Main courses query
  const {
    data: coursesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.getAllCourses(),
    refetchInterval: enableBackgroundRefresh ? refreshInterval : false,
  });

  // Process the data based on pagination
  const courses = Array.isArray(coursesData) ? coursesData : (coursesData as any)?.data || [];
  const pagination = !Array.isArray(coursesData) ? (coursesData as any)?.pagination : undefined;

  // Calculate stats
  const stats = {
    total: courses.length,
    published: courses.filter((course: Course) => course.status === 'PUBLISHED').length,
    drafts: courses.filter((course: Course) => course.status === 'DRAFT').length,
  };

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: (data: CreateCourseData) => courseApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCourseData> }) =>
      courseApi.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => courseApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  // Actions
  const actions = {
    createCourse: async (data: CreateCourseData) => {
      const result = await createCourseMutation.mutateAsync(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    updateCourse: (id: string, data: Partial<CreateCourseData>) =>
      updateCourseMutation.mutateAsync({ id, data }),
    deleteCourse: (id: string) => deleteCourseMutation.mutateAsync(id),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
    refreshInBackground: () => refetch(),
    prefetchPopularCourses: () => {
      // Mock implementation
      return Promise.resolve();
    },
  };

  // Mutation states
  const mutations = {
    creating: createCourseMutation.isPending,
    updating: updateCourseMutation.isPending,
    deleting: deleteCourseMutation.isPending,
  };

  return {
    courses,
    pagination,
    stats,
    isLoading,
    error: error?.message || null,
    actions,
    mutations,
    // Handle errors through the error state
    hasError: !!error,
    errorMessage: error?.message || null,
  };
};
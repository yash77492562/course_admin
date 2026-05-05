import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCoursesOptimized } from '../useCourses.optimized';
import { courseApi } from '../../lib/api/courses';

// Mock the courseApi
jest.mock('../../lib/api/courses', () => ({
  courseApi: {
    getAllCourses: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    getCourseById: jest.fn(),
  },
}));

const mockCourseApi = courseApi as jest.Mocked<typeof courseApi>;

describe('useCoursesOptimized', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const mockCourses = [
    {
      id: '1',
      title: 'Test Course 1',
      description: 'Description 1',
      status: 'PUBLISHED' as const,
      price: 100,
      discountPrice: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Test Course 2',
      description: 'Description 2',
      status: 'DRAFT' as const,
      price: 150,
      discountPrice: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('data fetching', () => {
    it('should fetch courses successfully', async () => {
      // Arrange
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);

      // Act
      const { result } = renderHook(() => useCoursesOptimized(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual(mockCourses);
      expect(result.current.stats.total).toBe(2);
      expect(result.current.stats.published).toBe(1);
      expect(result.current.stats.drafts).toBe(1);
    });

    it('should handle paginated data', async () => {
      // Arrange
      const paginatedResponse = {
        data: mockCourses,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockCourseApi.getAllCourses.mockResolvedValue(paginatedResponse);

      // Act
      const { result } = renderHook(
        () => useCoursesOptimized({ enablePagination: true }),
        { wrapper }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual(mockCourses);
      expect(result.current.pagination).toEqual(paginatedResponse.pagination);
    });

    it('should handle fetch errors', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch courses';
      mockCourseApi.getAllCourses.mockRejectedValue(new Error(errorMessage));

      const onError = jest.fn();

      // Act
      const { result } = renderHook(
        () => useCoursesOptimized({ onError }),
        { wrapper }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(onError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('mutations', () => {
    it('should create course with optimistic update', async () => {
      // Arrange
      const newCourseData = {
        title: 'New Course',
        description: 'New Description',
        price: 200,
      };

      const createdCourse = {
        id: '3',
        ...newCourseData,
        status: 'DRAFT' as const,
        discountPrice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);
      mockCourseApi.createCourse.mockResolvedValue({
        success: true,
        data: createdCourse,
      });

      // Act
      const { result } = renderHook(() => useCoursesOptimized(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create course
      await result.current.actions.createCourse(newCourseData);

      // Assert
      expect(mockCourseApi.createCourse).toHaveBeenCalledWith(newCourseData);
      expect(result.current.mutations.creating).toBe(false);
    });

    it('should update course with optimistic update', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Course Title',
      };

      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);
      mockCourseApi.updateCourse.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useCoursesOptimized(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update course
      await result.current.actions.updateCourse('1', updateData);

      // Assert
      expect(mockCourseApi.updateCourse).toHaveBeenCalledWith('1', updateData);
      expect(result.current.mutations.updating).toBe(false);
    });

    it('should delete course with optimistic update', async () => {
      // Arrange
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);
      mockCourseApi.deleteCourse.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useCoursesOptimized(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Delete course
      await result.current.actions.deleteCourse('1');

      // Assert
      expect(mockCourseApi.deleteCourse).toHaveBeenCalledWith('1');
      expect(result.current.mutations.deleting).toBe(false);
    });

    it('should handle mutation errors', async () => {
      // Arrange
      const errorMessage = 'Failed to create course';
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);
      mockCourseApi.createCourse.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const onError = jest.fn();

      // Act
      const { result } = renderHook(
        () => useCoursesOptimized({ onError }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to create course
      await expect(
        result.current.actions.createCourse({
          title: 'New Course',
          description: 'Description',
          price: 100,
        })
      ).rejects.toThrow(errorMessage);

      // Assert
      expect(onError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('background refresh', () => {
    it('should enable background refresh when configured', async () => {
      // Arrange
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);

      // Act
      const { result } = renderHook(
        () => useCoursesOptimized({ 
          enableBackgroundRefresh: true,
          refreshInterval: 1000 // 1 second for testing
        }),
        { wrapper }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual(mockCourses);
    });

    it('should disable background refresh when configured', async () => {
      // Arrange
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);

      // Act
      const { result } = renderHook(
        () => useCoursesOptimized({ enableBackgroundRefresh: false }),
        { wrapper }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual(mockCourses);
    });
  });

  describe('cache management', () => {
    it('should provide cache invalidation methods', async () => {
      // Arrange
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);

      // Act
      const { result } = renderHook(() => useCoursesOptimized(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.actions.invalidateAll).toBe('function');
      expect(typeof result.current.actions.invalidateLists).toBe('function');
      expect(typeof result.current.actions.refreshInBackground).toBe('function');
    });

    it('should provide prefetch methods', async () => {
      // Arrange
      mockCourseApi.getAllCourses.mockResolvedValue(mockCourses);

      // Act
      const { result } = renderHook(() => useCoursesOptimized(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.actions.prefetchPopularCourses).toBe('function');
    });
  });
});
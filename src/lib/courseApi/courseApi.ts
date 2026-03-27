import { apiClient } from '../api';
import { Course, CreateCourseData, CreateModuleData, CourseModule } from '@/types/course';
import { PaginationParams, PaginatedResponse } from '@/types/pagination/pagination';

export const courseApi = {
  // Course operations with pagination support
  getAllCourses: (params?: PaginationParams): Promise<PaginatedResponse<Course> | Course[]> => {
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      
      return apiClient.get<PaginatedResponse<Course>>(`/courses?${searchParams.toString()}`);
    }
    return apiClient.get<Course[]>('/courses');
  },

  getPublishedCourses: (params?: PaginationParams): Promise<PaginatedResponse<Course> | Course[]> => {
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      
      return apiClient.get<PaginatedResponse<Course>>(`/courses/public?${searchParams.toString()}`);
    }
    return apiClient.get<Course[]>('/courses/public');
  },

  getCourseById: (id: string): Promise<Course> => 
    apiClient.get<Course>(`/courses/${id}`),

  // Admin-only course creation - returns created course data
  createCourse: async (data: CreateCourseData): Promise<{ success: boolean; data?: Course; error?: string }> => {
    try {
      const response = await apiClient.post<{ status: number; success: boolean; message: string; data: Course }>('/admin/courses', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to create course' 
      };
    }
  },

  updateCourse: (id: string, data: Partial<CreateCourseData>): Promise<void> => 
    apiClient.put<void>(`/courses/${id}`, data),

  deleteCourse: (id: string): Promise<void> => 
    apiClient.delete<void>(`/courses/${id}`),

  // Module operations
  addModuleToCourse: (courseId: string, data: CreateModuleData): Promise<void> => 
    apiClient.post<void>(`/courses/${courseId}/modules`, data),

  updateModule: (moduleId: string, data: Partial<CreateModuleData>): Promise<void> => 
    apiClient.put<void>(`/courses/modules/${moduleId}`, data),

  deleteModule: (moduleId: string): Promise<void> => 
    apiClient.delete<void>(`/courses/modules/${moduleId}`),
};
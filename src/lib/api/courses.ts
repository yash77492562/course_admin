import { apiClient } from './api';
import { Course, CreateCourseData, CreateModuleData } from '../../types/course/course';

export const courseApi = {
  getAllCourses: async (params?: any): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/courses', { params });
    return response;
  },

  getCourseById: async (id: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response;
  },

  createCourse: async (data: CreateCourseData): Promise<{ success: boolean; data?: Course; error?: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: Course }>('/admin/courses', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to create course' 
      };
    }
  },

  updateCourse: async (id: string, data: Partial<CreateCourseData>): Promise<void> => {
    await apiClient.put(`/courses/${id}`, data);
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },

  addModuleToCourse: async (courseId: string, data: CreateModuleData): Promise<void> => {
    await apiClient.post(`/courses/${courseId}/modules`, data);
  },

  updateModule: async (moduleId: string, data: Partial<CreateModuleData>): Promise<void> => {
    await apiClient.put(`/courses/modules/${moduleId}`, data);
  },

  deleteModule: async (moduleId: string): Promise<void> => {
    await apiClient.delete(`/courses/modules/${moduleId}`);
  },
};
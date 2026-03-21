import { apiClient } from '../api';
import { Course, CreateCourseData, CreateModuleData, CourseModule } from '@/types/course';

export const courseApi = {
  // Course operations
  getAllCourses: (): Promise<Course[]> => 
    apiClient.get<Course[]>('/courses'),

  getCourseById: (id: string): Promise<Course> => 
    apiClient.get<Course>(`/courses/${id}`),

  // Admin-only course creation - returns only status, success, message
  createCourse: async (data: CreateCourseData): Promise<void> => {
    const response = await apiClient.simplePost('/admin/courses', data);
    // Response contains { status, success, message } - no data returned
    return;
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
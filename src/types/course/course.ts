 export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  level: CourseLevel;
  category: string;
  thumbnail: string;
  instructor: string;
  instructorBio?: string;
  rating: number;
  studentsCount: number;
  
  // Course scheduling and availability
  spotsLeft?: number;
  nextCohort?: string;
  
  // Course content
  features: string[];
  skills?: string[];
  tools?: string[];
  
  // Course outcomes
  outcomes?: string[];
  careerPaths?: string[];
  jobTitles?: string[];
  
  // Course structure
  totalModules: number;
  totalLessons: number;
  totalHours?: string;
  
  // Prerequisites
  prerequisites?: string[];
  requirements?: string[];
  
  // Support and certification
  careerSupport?: string[];
  certification: boolean;
  certificateName?: string;
  
  // Additional info
  faqs?: any[];
  highlights?: string[];
  
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  modules?: CourseModule[];
  _count?: {
    enrollments: number;
  };
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  objectives?: string[];
  courseId: string;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  
  // Content type
  contentType?: 'VIDEO' | 'PDF';
  
  // Video fields
  videoUrl?: string;
  videoUrls?: Record<string, string>; // Multiple quality URLs (legacy MP4)
  videoType: 'UPLOAD' | 'YOUTUBE'; // Required field to determine player type
  thumbnail?: string;
  originalWidth?: number;
  originalHeight?: number;
  videoDuration?: number;
  
  // HLS streaming fields
  hlsMasterPlaylist?: string; // HLS master playlist URL
  hlsQualities?: Record<string, string>; // HLS quality playlists per quality
  
  // PDF fields
  pdfUrl?: string;
  pdfPassword?: string;
  isPasswordProtected?: boolean;
  
  order: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  level: CourseLevel;
  category: string;
  thumbnail: string;
  instructor: string;
  instructorBio?: string;
  
  // Course scheduling and availability
  spotsLeft?: number;
  nextCohort?: string;
  
  // Course content
  features: string[];
  skills?: string[];
  tools?: string[];
  
  // Course outcomes
  outcomes?: string[];
  careerPaths?: string[];
  jobTitles?: string[];
  
  // Course structure
  totalModules?: number;
  totalLessons?: number;
  totalHours?: string;
  
  // Prerequisites
  prerequisites?: string[];
  requirements?: string[];
  
  // Support and certification
  careerSupport?: string[];
  certification?: boolean;
  certificateName?: string;
  
  // Additional info
  faqs?: any[];
  highlights?: string[];
  
  status?: CourseStatus;
}

export interface CreateModuleData {
  title: string;
  description: string;
  duration: string;
  order: number;
  objectives?: string[];
}
import { CourseStatus, CourseLevel } from '@/types/course';

export const COURSE_CATEGORIES = [
  'Data Analytics',
  'Data Engineering', 
  'Data Science',
  'Data Science & AI',
  'Machine Learning',
  'Business Intelligence',
  'Cloud Computing',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  'Data Analytics': '📊',
  'Data Engineering': '⚙️',
  'Data Science': '🤖',
  'Data Science & AI': '🤖',
  'Machine Learning': '🧠',
  'Business Intelligence': '📈',
  'Cloud Computing': '☁️',
};

export const STATUS_VARIANTS = {
  [CourseStatus.PUBLISHED]: 'success' as const,
  [CourseStatus.DRAFT]: 'warning' as const,
  [CourseStatus.ARCHIVED]: 'secondary' as const,
};

export const LEVEL_COLORS = {
  [CourseLevel.BEGINNER]: 'bg-green-100 text-green-800',
  [CourseLevel.INTERMEDIATE]: 'bg-yellow-100 text-yellow-800', 
  [CourseLevel.ADVANCED]: 'bg-red-100 text-red-800',
};

export const DEFAULT_COURSE_THUMBNAIL = '/placeholder-course.jpg';
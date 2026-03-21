'use client';

import { Course } from '@/types/course';

interface AdminCourseCardProps {
  course: Course;
  onClick: () => void;
}

export function AdminCourseCard({ course, onClick }: AdminCourseCardProps) {
  const getIconForCategory = (category: string): string => {
    const categoryIcons: { [key: string]: string } = {
      'Data Analytics': '📊',
      'Data Engineering': '⚙️',
      'Data Science': '🤖',
      'Data Science & AI': '🤖',
      'Machine Learning': '🧠',
      'Business Intelligence': '📈',
      'Cloud Computing': '☁️',
    };
    
    return categoryIcons[category] || '📚';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-8 relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-300 group"
    >
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
      
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
          {course.status}
        </span>
      </div>
      
      {/* Icon */}
      <div className="w-13 h-13 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-2xl mb-5">
        {getIconForCategory(course.category)}
      </div>
      
      {/* Title */}
      <h3 
        className="text-gray-900 mb-2.5 group-hover:text-blue-600 transition-colors"
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.2rem',
          fontWeight: '700',
          letterSpacing: '-0.2px'
        }}
      >
        {course.title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 text-sm leading-relaxed mb-6">
        {course.shortDescription && course.shortDescription.length > 10 
          ? course.shortDescription 
          : course.description && course.description.length > 10
          ? course.description.substring(0, 150) + '...'
          : 'Transform raw data into actionable insights. Master essential tools and techniques for modern data analysis.'
        }
      </p>
      
      {/* Tags */}
      {course.features && course.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {course.features.slice(0, 4).map((feature, index) => (
            <span
              key={index}
              className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
              style={{
                letterSpacing: '0.4px'
              }}
            >
              {feature}
            </span>
          ))}
          {course.features.length > 4 && (
            <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
              +{course.features.length - 4}
            </span>
          )}
        </div>
      )}
      
      {/* Footer Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span className="font-medium">£{course.price}</span>
        <span>{course._count?.enrollments || 0} students</span>
      </div>
      
      {/* CTA Link */}
      <div className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 transition-all duration-200 group-hover:gap-2">
        Manage course
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
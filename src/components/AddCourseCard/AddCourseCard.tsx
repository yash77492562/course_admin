import React from 'react';

interface AddCourseCardProps {
  onClick: () => void;
}

export function AddCourseCard({ onClick }: AddCourseCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[280px]"
    >
      {/* Plus Icon */}
      <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
        <svg 
          className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>

      {/* Text */}
      <h3 className="text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors mb-2">
        Add New Course
      </h3>
      <p className="text-sm text-gray-500 text-center">
        Create a new course with name, description, and tags
      </p>
    </div>
  );
}
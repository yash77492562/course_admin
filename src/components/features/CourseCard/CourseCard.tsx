import React from 'react';
import { Course } from '../../../types/course/course';

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
  onDuplicate?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'data science':
        return '🤖';
      case 'programming':
        return '💻';
      case 'web development':
        return '🌐';
      default:
        return '📚';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <article 
      className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(course)}
    >
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={`${course.title} thumbnail`}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="text-2xl">
            {getCategoryIcon(course.category)}
          </div>
          <span className={`inline-flex items-center rounded-full font-medium px-3 py-1 text-sm ${getStatusColor(course.status)}`}>
            {course.status}
          </span>
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.shortDescription || course.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {course.skills?.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full font-medium bg-gray-100 text-gray-800 px-2 py-1 text-xs"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-2">Instructor: {course.instructor}</p>
          <p className="text-gray-600 text-sm mb-2">Category: {course.category}</p>
          <p className="text-gray-600 text-sm mb-2">Level: {course.level}</p>
        </div>

        {(course.totalModules || course.totalLessons || course.duration) && (
          <div className="flex gap-4 mb-4 text-sm text-gray-500">
            {course.totalModules && <span>{course.totalModules} modules</span>}
            {course.totalLessons && <span>{course.totalLessons} lessons</span>}
            {course.duration && <span>{course.duration}</span>}
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>
            ${course.price}
            {course.originalPrice && course.originalPrice !== course.price && (
              <span className="ml-2 line-through text-gray-400">
                ${course.originalPrice}
              </span>
            )}
          </span>
          <span>{course._count?.enrollments || 0} students</span>
        </div>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course);
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              aria-label={`Edit ${course.title}`}
            >
              Edit
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(course);
              }}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              aria-label={`Duplicate ${course.title}`}
            >
              Duplicate
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(course.id);
              }}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              aria-label={`Delete ${course.title}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
'use client';

import { Course, CourseStatus } from '@/types/course/course';
import { Button } from '@/components/ui/Button/Button';

interface CourseListProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
  onView: (courseId: string) => void;
}

export function CourseList({ courses, onEdit, onDelete, onView }: CourseListProps) {
  const getStatusBadge = (status: CourseStatus) => {
    const statusStyles = {
      [CourseStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [CourseStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [CourseStatus.ARCHIVED]: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelStyles = {
      BEGINNER: 'bg-blue-100 text-blue-800',
      INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
      ADVANCED: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelStyles[level as keyof typeof levelStyles] || 'bg-gray-100 text-gray-800'}`}>
        {level}
      </span>
    );
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No courses found</div>
        <p className="text-gray-400 mt-2">Create your first course to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {courses.map((course) => (
          <li key={course.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {course.title}
                    </h3>
                    {getStatusBadge(course.status)}
                    {getLevelBadge(course.level)}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                    <span>Category: {course.category}</span>
                    <span>•</span>
                    <span>Instructor: {course.instructor}</span>
                    <span>•</span>
                    <span>Duration: {course.duration}</span>
                    <span>•</span>
                    <span>Price: £{course.price}</span>
                    {course._count && (
                      <>
                        <span>•</span>
                        <span>Students: {course._count.enrollments}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                  {course.features && course.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {course.features.slice(0, 4).map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {feature}
                        </span>
                      ))}
                      {course.features.length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          +{course.features.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(course.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(course)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this course?')) {
                        onDelete(course.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
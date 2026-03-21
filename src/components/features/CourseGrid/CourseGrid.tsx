import { Course } from '@/types/course/course';
import { CourseCard } from '../CourseCard/CourseCard';
import { Button } from '@/components/ui/Button/Button';

interface CourseGridProps {
  courses: Course[];
  loading: boolean;
  onCourseClick: (course: Course) => void;
  onCreateCourse: () => void;
}

export function CourseGrid({ 
  courses, 
  loading, 
  onCourseClick, 
  onCreateCourse 
}: CourseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first course to get started with your learning platform.
        </p>
        <Button onClick={onCreateCourse}>
          Create Your First Course
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onClick={() => onCourseClick(course)}
        />
      ))}
    </div>
  );
}
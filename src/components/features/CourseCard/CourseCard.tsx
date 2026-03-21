import { Course } from '@/types/course/course';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { CATEGORY_ICONS, STATUS_VARIANTS } from '@/lib/constants/constants';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  const categoryIcon = CATEGORY_ICONS[course.category] || '📚';
  const statusVariant = STATUS_VARIANTS[course.status];

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="text-2xl">{categoryIcon}</div>
          <Badge variant={statusVariant}>
            {course.status}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.shortDescription || course.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {course.skills?.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {skill}
            </Badge>
          ))}
          {course.skills && course.skills.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{course.skills.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>£{course.price}</span>
          <span>{course.studentsCount} students</span>
        </div>
      </CardContent>
    </Card>
  );
}
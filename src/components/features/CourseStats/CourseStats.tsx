import { Card, CardContent } from '@/components/ui/Card/Card';

interface CourseStatsProps {
  stats: {
    total: number;
    published: number;
    drafts: number;
  };
}

export function CourseStats({ stats }: CourseStatsProps) {
  const statItems = [
    { label: 'Total Courses', value: stats.total, color: 'text-blue-600' },
    { label: 'Published', value: stats.published, color: 'text-green-600' },
    { label: 'Drafts', value: stats.drafts, color: 'text-yellow-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold ${item.color} mb-2`}>
              {item.value}
            </div>
            <div className="text-gray-600">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
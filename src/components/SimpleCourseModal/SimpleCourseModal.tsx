'use client';

import { useState } from 'react';
import { CreateCourseData, CourseLevel, CourseStatus } from '@/types/course';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';

interface SimpleCourseModalProps {
  onSubmit: (data: CreateCourseData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function SimpleCourseModal({ onSubmit, onClose }: SimpleCourseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const courseData: CreateCourseData = {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.description.substring(0, 100) + '...',
      category: 'General',
      price: 0,
      duration: '8 weeks',
      level: CourseLevel.BEGINNER,
      thumbnail: '/placeholder-course.jpg',
      instructor: 'Riva Team',
      features: tags,
      status: CourseStatus.DRAFT,
    };

    const result = await onSubmit(courseData);
    setIsLoading(false);
    
    if (result.success) {
      setFormData({
        title: '',
        description: '',
        tags: '',
      });
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Course</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Course Name *
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Data Analytics Program"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="Brief description of the course"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="SQL, Python, Power BI (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
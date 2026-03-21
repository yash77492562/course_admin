'use client';

import { useState } from 'react';
import { CreateCourseData, CourseLevel, CourseStatus } from '@/types/course';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Select } from '@/components/ui/Select/Select';
import { COURSE_CATEGORIES } from '@/lib/constants/constants';

interface QuickCourseModalProps {
  onSubmit: (data: CreateCourseData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function QuickCourseModal({ onSubmit, onClose }: QuickCourseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const skills = formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const courseData: CreateCourseData = {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.description.substring(0, 100) + '...',
      category: formData.category,
      price: 0,
      duration: '8 weeks',
      level: CourseLevel.BEGINNER,
      thumbnail: '/placeholder-course.jpg',
      instructor: 'Riva Team',
      features: ['Hands-on projects', 'Expert instruction', 'Career support'],
      skills,
      status: CourseStatus.DRAFT,
    };

    const result = await onSubmit(courseData);
    setIsLoading(false);
    
    if (result.success) {
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        skills: '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <Select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              {COURSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
              Skills Taught
            </label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              placeholder="SQL, Python, Power BI (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate skills with commas
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
'use client';

import { useState } from 'react';
import { Course, CreateCourseData, CourseLevel, CourseStatus } from '@/types/course';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Select } from '@/components/ui/Select/Select';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CreateCourseData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CourseForm({ course, onSubmit, onCancel, isLoading }: CourseFormProps) {
  const [formData, setFormData] = useState<CreateCourseData>({
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price || 0,
    originalPrice: course?.originalPrice || undefined,
    duration: course?.duration || '',
    level: course?.level || CourseLevel.BEGINNER,
    category: course?.category || '',
    thumbnail: course?.thumbnail || '',
    instructor: course?.instructor || '',
    features: course?.features || [],
    status: course?.status || CourseStatus.DRAFT,
  });

  const [featuresInput, setFeaturesInput] = useState(
    course?.features?.join(', ') || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const features = featuresInput
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    await onSubmit({
      ...formData,
      features,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'originalPrice' 
        ? parseFloat(value) || 0 
        : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter course title"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            placeholder="e.g., Data Analytics"
          />
        </div>

        <div>
          <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
            Instructor *
          </label>
          <Input
            id="instructor"
            name="instructor"
            value={formData.instructor}
            onChange={handleInputChange}
            required
            placeholder="Instructor name"
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration *
          </label>
          <Input
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            required
            placeholder="e.g., 12 weeks"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (£) *
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            required
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Original Price (£)
          </label>
          <Input
            id="originalPrice"
            name="originalPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.originalPrice || ''}
            onChange={handleInputChange}
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
            Level *
          </label>
          <Select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleInputChange}
            required
          >
            <option value={CourseLevel.BEGINNER}>Beginner</option>
            <option value={CourseLevel.INTERMEDIATE}>Intermediate</option>
            <option value={CourseLevel.ADVANCED}>Advanced</option>
          </Select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <Select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value={CourseStatus.DRAFT}>Draft</option>
            <option value={CourseStatus.PUBLISHED}>Published</option>
            <option value={CourseStatus.ARCHIVED}>Archived</option>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
          Thumbnail URL *
        </label>
        <Input
          id="thumbnail"
          name="thumbnail"
          value={formData.thumbnail}
          onChange={handleInputChange}
          required
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={4}
          placeholder="Enter course description"
        />
      </div>

      <div>
        <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
          Features (comma-separated)
        </label>
        <Textarea
          id="features"
          value={featuresInput}
          onChange={(e) => setFeaturesInput(e.target.value)}
          rows={3}
          placeholder="SQL, Python, Power BI, Tableau"
        />
        <p className="text-sm text-gray-500 mt-1">
          Separate features with commas (e.g., SQL, Python, Power BI)
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
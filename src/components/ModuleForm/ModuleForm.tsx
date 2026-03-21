'use client';

import { useState } from 'react';
import { CourseModule, CreateModuleData } from '@/types/course/course';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';

interface ModuleFormProps {
  module?: CourseModule;
  onSubmit: (data: CreateModuleData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  nextOrder: number;
}

export function ModuleForm({ module, onSubmit, onCancel, isLoading, nextOrder }: ModuleFormProps) {
  const [formData, setFormData] = useState<CreateModuleData>({
    title: module?.title || '',
    description: module?.description || '',
    duration: module?.duration || '',
    order: module?.order || nextOrder,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Module Title *
        </label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="Enter module title"
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
          rows={3}
          placeholder="Enter module description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            placeholder="e.g., 2 weeks"
          />
        </div>

        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
            Order *
          </label>
          <Input
            id="order"
            name="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
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
          {isLoading ? 'Saving...' : module ? 'Update Module' : 'Add Module'}
        </Button>
      </div>
    </form>
  );
}
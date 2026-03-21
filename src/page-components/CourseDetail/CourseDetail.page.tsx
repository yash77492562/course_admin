'use client';

import { useState } from 'react';
import { Course } from '@/types/course';
import { ModuleForm } from '@/components/ModuleForm';
import { Button, Badge, Card, CardContent, Loading, Error, Warning } from '@/components/ui';

interface CourseDetailPageProps {
  course: Course;
  onUpdateCourse: (data: any) => Promise<void>;
  onDeleteCourse: () => Promise<void>;
  onAddModule: (moduleData: any) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function CourseDetailPage({
  course,
  onUpdateCourse,
  onDeleteCourse,
  onAddModule,
  isLoading = false,
  error
}: CourseDetailPageProps) {
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddModule = async (moduleData: any) => {
    try {
      await onAddModule(moduleData);
      setShowModuleForm(false);
    } catch (error) {
      console.error('Failed to add module:', error);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await onDeleteCourse();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading course details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Error 
          title="Failed to load course"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
              </div>
              <p className="text-gray-600">{course.category} • {course.instructor}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowModuleForm(true)}>
                Add Module
              </Button>
              <Button variant="outline">
                Edit Course
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Overview */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Course Overview</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{course.description}</p>
                  </div>
                  
                  {course.features && course.features.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {course.features.map((feature, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modules Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Course Modules</h2>
                  <Button size="sm" onClick={() => setShowModuleForm(true)}>
                    Add Module
                  </Button>
                </div>
                
                {course.modules && course.modules.length > 0 ? (
                  <div className="space-y-3">
                    {course.modules.map((module, index) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Module {index + 1}: {module.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800">
                            {module.duration}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-gray-600">No modules added yet</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowModuleForm(true)}
                    >
                      Add First Module
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Course Stats</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium">£{course.price}</span>
                  </div>
                  {course.originalPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price</span>
                      <span className="text-gray-500 line-through">£{course.originalPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enrollments</span>
                    <span className="font-medium">{course._count?.enrollments || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Image */}
            {course.thumbnail && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Course Thumbnail</h2>
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Module Modal */}
      {showModuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Add New Module</h2>
              <ModuleForm
                onSubmit={handleAddModule}
                onCancel={() => setShowModuleForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <Warning 
              title="Delete Course"
              message="Are you sure you want to delete this course? This action cannot be undone."
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteCourse}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Course
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
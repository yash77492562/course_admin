'use client';

import { useState } from 'react';
import { courseApi } from '@/lib/courseApi';
import { CreateCourseData, CourseLevel, CourseStatus } from '@/types/course/course';
import { Button } from '@/components/ui/Button/Button';

export function AdminApiTest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testCreateCourse = async () => {
    setLoading(true);
    setMessage('');

    const testCourse: CreateCourseData = {
      title: 'Test Course from Admin API',
      description: 'This course was created using the admin-only API endpoint that returns only status, success, and message.',
      price: 999,
      originalPrice: 1299,
      duration: '8 weeks',
      level: CourseLevel.INTERMEDIATE,
      category: 'Data Analytics',
      thumbnail: 'https://via.placeholder.com/400x300',
      instructor: 'Admin Test Instructor',
      features: ['Admin API', 'Test Course', 'Status Response'],
      status: CourseStatus.DRAFT,
    };

    try {
      // This will call the admin endpoint that returns only { status, success, message }
      await courseApi.createCourse(testCourse);
      setMessage('✅ Course created successfully! (Admin API returned only status, success, message)');
    } catch (error) {
      setMessage(`❌ Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-yellow-800 mb-4">
        🧪 Admin API Test
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        This test uses the admin-only course creation API (<code>/api/admin/courses</code>) 
        which returns only status, success, and message - no course data.
      </p>
      
      <div className="flex items-center space-x-4">
        <Button
          onClick={testCreateCourse}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Creating Test Course...' : 'Test Admin Course Creation'}
        </Button>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-yellow-600">
        <strong>API Endpoint:</strong> POST /api/admin/courses<br/>
        <strong>Response Format:</strong> {`{ status: number, success: boolean, message: string }`}<br/>
        <strong>Access:</strong> Admin panel only
      </div>
    </div>
  );
}
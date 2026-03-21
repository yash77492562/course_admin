'use client';

import { useState } from 'react';
import { Course, CreateCourseData, CourseLevel, CourseStatus } from '@/types/course/course';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Select } from '@/components/ui/Select/Select';

interface ComprehensiveCourseFormProps {
  course?: Course;
  onSubmit: (data: CreateCourseData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ComprehensiveCourseForm({ course, onSubmit, onCancel, isLoading }: ComprehensiveCourseFormProps) {
  const [formData, setFormData] = useState<CreateCourseData>({
    title: course?.title || '',
    description: course?.description || '',
    shortDescription: course?.shortDescription || '',
    price: course?.price || 0,
    originalPrice: course?.originalPrice || undefined,
    duration: course?.duration || '',
    level: course?.level || CourseLevel.BEGINNER,
    category: course?.category || '',
    thumbnail: course?.thumbnail || '',
    instructor: course?.instructor || '',
    instructorBio: course?.instructorBio || '',
    features: course?.features || [],
    skills: course?.skills || [],
    tools: course?.tools || [],
    outcomes: course?.outcomes || [],
    careerPaths: course?.careerPaths || [],
    jobTitles: course?.jobTitles || [],
    totalModules: course?.totalModules || 0,
    totalLessons: course?.totalLessons || 0,
    totalHours: course?.totalHours || '',
    prerequisites: course?.prerequisites || [],
    requirements: course?.requirements || [],
    careerSupport: course?.careerSupport || [],
    certification: course?.certification || false,
    certificateName: course?.certificateName || '',
    highlights: course?.highlights || [],
    status: course?.status || CourseStatus.DRAFT,
  });

  // Input states for array fields
  const [featuresInput, setFeaturesInput] = useState(course?.features?.join(', ') || '');
  const [skillsInput, setSkillsInput] = useState(course?.skills?.join(', ') || '');
  const [toolsInput, setToolsInput] = useState(course?.tools?.join(', ') || '');
  const [outcomesInput, setOutcomesInput] = useState(course?.outcomes?.join(', ') || '');
  const [careerPathsInput, setCareerPathsInput] = useState(course?.careerPaths?.join(', ') || '');
  const [jobTitlesInput, setJobTitlesInput] = useState(course?.jobTitles?.join(', ') || '');
  const [prerequisitesInput, setPrerequisitesInput] = useState(course?.prerequisites?.join(', ') || '');
  const [requirementsInput, setRequirementsInput] = useState(course?.requirements?.join(', ') || '');
  const [careerSupportInput, setCareerSupportInput] = useState(course?.careerSupport?.join(', ') || '');
  const [highlightsInput, setHighlightsInput] = useState(course?.highlights?.join(', ') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parseArrayInput = (input: string) => 
      input.split(',').map(item => item.trim()).filter(item => item.length > 0);

    await onSubmit({
      ...formData,
      features: parseArrayInput(featuresInput),
      skills: parseArrayInput(skillsInput),
      tools: parseArrayInput(toolsInput),
      outcomes: parseArrayInput(outcomesInput),
      careerPaths: parseArrayInput(careerPathsInput),
      jobTitles: parseArrayInput(jobTitlesInput),
      prerequisites: parseArrayInput(prerequisitesInput),
      requirements: parseArrayInput(requirementsInput),
      careerSupport: parseArrayInput(careerSupportInput),
      highlights: parseArrayInput(highlightsInput),
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? parseFloat(value) || 0 
        : type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
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

          <div className="md:col-span-2">
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Short Description (for course cards)
            </label>
            <Input
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription || ''}
              onChange={handleInputChange}
              placeholder="Brief description for course listings"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Full Description *
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Detailed course description"
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
            <label htmlFor="totalHours" className="block text-sm font-medium text-gray-700 mb-2">
              Total Hours
            </label>
            <Input
              id="totalHours"
              name="totalHours"
              value={formData.totalHours || ''}
              onChange={handleInputChange}
              placeholder="e.g., 120 hours"
            />
          </div>
        </div>
      </div>

      {/* Instructor Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instructor Information</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
              Instructor Name *
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
            <label htmlFor="instructorBio" className="block text-sm font-medium text-gray-700 mb-2">
              Instructor Bio
            </label>
            <Textarea
              id="instructorBio"
              name="instructorBio"
              value={formData.instructorBio || ''}
              onChange={handleInputChange}
              rows={3}
              placeholder="Brief instructor background and experience"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Current Price (£) *
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
              placeholder="999.00"
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
              placeholder="1299.00"
            />
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Content</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
              What You'll Learn (Features) *
            </label>
            <Textarea
              id="features"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              rows={3}
              placeholder="Query and analyse data using SQL, Perform advanced analysis using Excel, Build professional dashboards in Power BI and Tableau"
            />
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Skills Gained
            </label>
            <Textarea
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              rows={2}
              placeholder="SQL, Python, Data Analysis, Statistical Analysis"
            />
          </div>

          <div>
            <label htmlFor="tools" className="block text-sm font-medium text-gray-700 mb-2">
              Tools & Technologies
            </label>
            <Textarea
              id="tools"
              value={toolsInput}
              onChange={(e) => setToolsInput(e.target.value)}
              rows={2}
              placeholder="Power BI, Tableau, Excel, Python, SQL Server"
            />
          </div>

          <div>
            <label htmlFor="outcomes" className="block text-sm font-medium text-gray-700 mb-2">
              Learning Outcomes
            </label>
            <Textarea
              id="outcomes"
              value={outcomesInput}
              onChange={(e) => setOutcomesInput(e.target.value)}
              rows={3}
              placeholder="Build a portfolio with real-world projects, Pass technical and competency-based interviews, Understand cloud-based analytics using Azure & Databricks"
            />
          </div>
        </div>
      </div>

      {/* Career Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Career Information</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="careerPaths" className="block text-sm font-medium text-gray-700 mb-2">
              Career Paths
            </label>
            <Textarea
              id="careerPaths"
              value={careerPathsInput}
              onChange={(e) => setCareerPathsInput(e.target.value)}
              rows={2}
              placeholder="Data Analyst, Business Analyst, Data Scientist, BI Developer"
            />
          </div>

          <div>
            <label htmlFor="jobTitles" className="block text-sm font-medium text-gray-700 mb-2">
              Potential Job Titles
            </label>
            <Textarea
              id="jobTitles"
              value={jobTitlesInput}
              onChange={(e) => setJobTitlesInput(e.target.value)}
              rows={2}
              placeholder="Junior Data Analyst, Business Intelligence Analyst, Data Visualization Specialist"
            />
          </div>

          <div>
            <label htmlFor="careerSupport" className="block text-sm font-medium text-gray-700 mb-2">
              Career Support Features
            </label>
            <Textarea
              id="careerSupport"
              value={careerSupportInput}
              onChange={(e) => setCareerSupportInput(e.target.value)}
              rows={3}
              placeholder="Resume optimisation, LinkedIn branding, Portfolio website creation, Technical interview preparation, Mock interviews"
            />
          </div>
        </div>
      </div>

      {/* Prerequisites & Requirements */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prerequisites & Requirements</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-2">
              Prerequisites
            </label>
            <Textarea
              id="prerequisites"
              value={prerequisitesInput}
              onChange={(e) => setPrerequisitesInput(e.target.value)}
              rows={2}
              placeholder="Basic computer skills, High school mathematics, No prior programming experience required"
            />
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
              Technical Requirements
            </label>
            <Textarea
              id="requirements"
              value={requirementsInput}
              onChange={(e) => setRequirementsInput(e.target.value)}
              rows={2}
              placeholder="Windows 10 or macOS, 8GB RAM minimum, Stable internet connection"
            />
          </div>
        </div>
      </div>

      {/* Course Structure */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="totalModules" className="block text-sm font-medium text-gray-700 mb-2">
              Total Modules
            </label>
            <Input
              id="totalModules"
              name="totalModules"
              type="number"
              min="0"
              value={formData.totalModules || ''}
              onChange={handleInputChange}
              placeholder="8"
            />
          </div>

          <div>
            <label htmlFor="totalLessons" className="block text-sm font-medium text-gray-700 mb-2">
              Total Lessons
            </label>
            <Input
              id="totalLessons"
              name="totalLessons"
              type="number"
              min="0"
              value={formData.totalLessons || ''}
              onChange={handleInputChange}
              placeholder="40"
            />
          </div>
        </div>
      </div>

      {/* Certification */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Certification</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="certification"
              name="certification"
              type="checkbox"
              checked={formData.certification || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="certification" className="ml-2 block text-sm text-gray-900">
              Offers Certification
            </label>
          </div>

          {formData.certification && (
            <div>
              <label htmlFor="certificateName" className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Name
              </label>
              <Input
                id="certificateName"
                name="certificateName"
                value={formData.certificateName || ''}
                onChange={handleInputChange}
                placeholder="Certificate in Data Analytics"
              />
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="highlights" className="block text-sm font-medium text-gray-700 mb-2">
              Course Highlights
            </label>
            <Textarea
              id="highlights"
              value={highlightsInput}
              onChange={(e) => setHighlightsInput(e.target.value)}
              rows={2}
              placeholder="Industry-aligned curriculum, Real-world projects, One-to-one mentorship"
            />
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
              placeholder="https://example.com/course-image.jpg"
            />
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
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
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
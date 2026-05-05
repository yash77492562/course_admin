import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from '../CourseCard';
import { Course } from '../../../../types/course/course';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('CourseCard', () => {
  const mockCourse: Course = {
    id: '1',
    title: 'Test Course',
    description: 'This is a test course description',
    shortDescription: 'Short description',
    price: 99.99,
    originalPrice: 149.99,
    duration: '10 hours',
    level: 'BEGINNER',
    category: 'Data Science',
    thumbnail: 'https://example.com/thumbnail.jpg',
    instructor: 'John Doe',
    instructorBio: 'Experienced instructor',
    spotsLeft: 5,
    nextCohort: '2024-02-01',
    features: ['Feature 1', 'Feature 2'],
    skills: ['Skill 1', 'Skill 2'],
    tools: ['Tool 1', 'Tool 2'],
    outcomes: ['Outcome 1', 'Outcome 2'],
    careerPaths: ['Path 1', 'Path 2'],
    jobTitles: ['Title 1', 'Title 2'],
    totalModules: 5,
    totalLessons: 25,
    totalHours: '10',
    prerequisites: ['Prerequisite 1'],
    requirements: ['Requirement 1'],
    careerSupport: ['Support 1'],
    certification: true,
    certificateName: 'Test Certificate',
    faqs: [],
    highlights: ['Highlight 1'],
    modules: [],
    status: 'PUBLISHED',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDuplicate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render course information correctly', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('This is a test course description')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Data Science')).toBeInTheDocument();
    expect(screen.getByText('BEGINNER')).toBeInTheDocument();
  });

  it('should display price information correctly', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('should display course stats correctly', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('5 modules')).toBeInTheDocument();
    expect(screen.getByText('25 lessons')).toBeInTheDocument();
    expect(screen.getByText('10 hours')).toBeInTheDocument();
  });

  it('should show course status badge', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCourse);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCourse.id);
  });

  it('should call onDuplicate when duplicate button is clicked', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    const duplicateButton = screen.getByRole('button', { name: /duplicate/i });
    fireEvent.click(duplicateButton);

    expect(mockOnDuplicate).toHaveBeenCalledWith(mockCourse);
  });

  it('should handle course without original price', () => {
    const courseWithoutOriginalPrice = {
      ...mockCourse,
      originalPrice: undefined,
    };

    render(
      <CourseCard
        course={courseWithoutOriginalPrice}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.queryByText('$149.99')).not.toBeInTheDocument();
  });

  it('should handle draft course status', () => {
    const draftCourse = {
      ...mockCourse,
      status: 'DRAFT' as const,
    };

    render(
      <CourseCard
        course={draftCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('should display thumbnail image with correct alt text', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    const thumbnail = screen.getByAltText('Test Course thumbnail');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', mockCourse.thumbnail);
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalCourse = {
      id: '2',
      title: 'Minimal Course',
      description: 'Minimal description',
      price: 50,
      duration: '5 hours',
      level: 'INTERMEDIATE' as const,
      category: 'Programming',
      thumbnail: 'https://example.com/minimal.jpg',
      instructor: 'Jane Doe',
      features: ['Basic feature'],
      status: 'PUBLISHED' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Course;

    render(
      <CourseCard
        course={minimalCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText('Minimal Course')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(
      <CourseCard
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
  });
});
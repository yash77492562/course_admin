# Riva Data Admin Panel

Admin panel for managing Riva Data courses, modules, and content.

## Features

- ✅ Course Management (Create, Read, Update, Delete)
- ✅ Module Management (Add, Edit, Delete modules within courses)
- ✅ Course Details View
- ✅ Responsive Design with Tailwind CSS
- ✅ Form Validation
- ✅ Real-time Updates

## Getting Started

### Prerequisites

Make sure the backend is running on port 3002:

```bash
cd ../backend
npm run start:dev
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The admin panel will be available at [http://localhost:3001](http://localhost:3001)

## API Configuration

The admin panel connects to the backend API at `http://localhost:3002/api`. You can change this in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

## Course Management

### Creating a Course

1. Click "Add New Course" on the dashboard
2. Fill in all required fields:
   - Title, Description, Category
   - Instructor, Duration, Level
   - Price, Thumbnail URL
   - Features (comma-separated)
   - Status (Draft/Published/Archived)

### Managing Modules

1. Click "View" on any course to see its details
2. Add modules with title, description, duration, and order
3. Edit or delete existing modules
4. Modules are automatically ordered by their order number

## Database Schema

The admin panel works with the existing Prisma schema:

- **Course**: Main course entity with all course details
- **CourseModule**: Modules within a course
- **Lesson**: Individual lessons within modules (future enhancement)

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: NestJS (existing)
- **Database**: MongoDB with Prisma (existing)

## Development

The admin panel is built with:
- Server-side rendering with Next.js
- Type-safe API calls with TypeScript
- Responsive design with Tailwind CSS
- Form validation and error handling
- Optimistic UI updates
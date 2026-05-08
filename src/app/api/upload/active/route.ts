import { NextResponse } from 'next/server';

/**
 * GET /api/upload/active
 * Returns all active video uploads across all courses
 * This is used by GlobalUploadStatus to show real-time upload progress
 */
export async function GET() {
  try {
    // For now, return empty array since we don't have a backend endpoint yet
    // TODO: Implement backend endpoint to fetch active uploads from Redis
    return NextResponse.json({
      success: true,
      uploads: []
    });
  } catch (error) {
    console.error('Error fetching active uploads:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch active uploads'
      },
      { status: 500 }
    );
  }
}

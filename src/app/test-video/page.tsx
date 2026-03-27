'use client';

export default function TestVideoPage() {
  const testYouTubeUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";
  
  return (
    <div className="min-h-screen bg-black">
      {/* Header with back button */}
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => window.history.back()}
          className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Video Player Container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl">
          {/* Video Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Test YouTube Video
            </h1>
            <p className="text-gray-300">
              Testing YouTube embed functionality
            </p>
          </div>

          {/* Video Player */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={testYouTubeUrl}
              title="Test YouTube Video"
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          </div>

          {/* Video Info */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-4 bg-gray-900 bg-opacity-50 rounded-lg px-6 py-3">
              <span className="text-gray-300">
                📺 YouTube Video
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-sm">Test Video</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
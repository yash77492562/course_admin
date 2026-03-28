'use client';

interface YouTubePlayerProps {
  videoUrl: string; // YouTube URL (any format)
  title: string;
  className?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

// Convert any YouTube URL to embed format
function convertToEmbedUrl(youtubeUrl: string): string {
  let videoId = '';
  
  if (youtubeUrl.includes('youtube.com/watch?v=')) {
    videoId = youtubeUrl.split('v=')[1].split('&')[0];
  } else if (youtubeUrl.includes('youtu.be/')) {
    videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
  } else if (youtubeUrl.includes('youtube.com/embed/') || youtubeUrl.includes('youtube-nocookie.com/embed/')) {
    // Already an embed URL - extract video ID
    videoId = youtubeUrl.split('/embed/')[1].split('?')[0];
  }

  // Use nocookie domain for privacy
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function YouTubePlayer({
  videoUrl,
  title,
  className = '',
  onNext,
  onPrevious
}: YouTubePlayerProps) {
  const embedUrl = convertToEmbedUrl(videoUrl);

  return (
    <div className={`relative ${className}`}>
      {/* YouTube iframe */}
      <div className="w-full" style={{ minHeight: '500px' }}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full rounded-lg"
          style={{ minHeight: '500px', aspectRatio: '16/9' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Navigation Controls */}
      {(onNext || onPrevious) && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
              Previous
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              Next
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface PDFViewerSimpleProps {
  pdfUrl: string;
  password?: string;
  title?: string;
}

export function PDFViewerSimple({ pdfUrl, password, title }: PDFViewerSimpleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    console.log('📄 PDFViewerSimple mounted');
    console.log('PDF URL:', pdfUrl);
    console.log('Has password:', !!password);
    
    // Download the PDF and create a blob URL to bypass CORS
    const loadPDF = async () => {
      try {
        console.log('📥 Downloading PDF...');
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to download PDF (Status: ${response.status})`);
        }
        
        const blob = await response.blob();
        console.log('✅ PDF downloaded:', blob.size, 'bytes');
        
        const url = URL.createObjectURL(blob);
        console.log('✅ Blob URL created:', url);
        
        setBlobUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to load PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };
    
    loadPDF();
    
    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {title || 'PDF Lecture'}
          </h3>
          {password && (
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Password Protected
            </span>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start gap-2 text-red-800">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && blobUrl && (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={title || 'PDF Lecture'}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        {password ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-500">Use browser controls to navigate pages</span>
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-yellow-900">PDF Password:</p>
                <p className="text-base font-mono font-bold text-yellow-800 select-all">{password}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  alert('Password copied to clipboard!');
                }}
                className="ml-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 text-center">
            Use browser controls to navigate pages
          </div>
        )}
      </div>
    </div>
  );
}

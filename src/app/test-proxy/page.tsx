'use client';

import { useState } from 'react';

export default function TestProxyPage() {
  const [results, setResults] = useState<any[]>([]);

  const testEndpoint = async (name: string, url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      setResults(prev => [...prev, { name, status: response.status, success: true, data }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResults(prev => [...prev, { name, success: false, error: errorMessage }]);
    }
  };

  const runTests = async () => {
    setResults([]);
    
    // Test 1: Gateway API
    await testEndpoint('Gateway - Upload Active', '/api/upload/active');
    
    // Test 2: Gateway - Upload Status
    await testEndpoint('Gateway - Upload Status', '/api/upload/status/test123');
    
    // Test 3: Video Upload 460p Initiate
    await testEndpoint('Video Upload 460p - Initiate', '/video-upload-460p/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 'test',
        fileName: 'test.mp4',
        fileSize: 1000,
        quality: '460p',
      }),
    });
    
    // Test 4: Video Upload 720p Initiate
    await testEndpoint('Video Upload 720p - Initiate', '/video-upload-720p/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 'test',
        fileName: 'test.mp4',
        fileSize: 1000,
        quality: '720p',
      }),
    });
    
    // Test 5: Video Upload 1080p Initiate
    await testEndpoint('Video Upload 1080p - Initiate', '/video-upload-1080p/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 'test',
        fileName: 'test.mp4',
        fileSize: 1000,
        quality: '1080p',
      }),
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Proxy Test Page</h1>
      <p className="mb-4 text-gray-600">
        This page tests if the Next.js proxy is working correctly for all backend endpoints.
      </p>
      
      <button
        onClick={runTests}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium mb-6"
      >
        Run Tests
      </button>
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded border ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{result.name}</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  result.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.success ? `✓ ${result.status}` : '✗ Failed'}
              </span>
            </div>
            {result.success ? (
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : (
              <p className="text-red-600 text-sm">{result.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

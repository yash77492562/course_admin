'use client';

import { useState, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface PDFUploaderProps {
  onComplete: (data: {
    pdfUrl: string;
    title: string;
    isPasswordProtected: boolean;
    password?: string;
  }) => void;
  onCancel: () => void;
}

export function PDFUploader({ onComplete, onCancel }: PDFUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError, info } = useNotifications();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    console.log('📄 PDF selected:', selectedFile.name, `(${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      showError('Invalid File', 'Please select a PDF file');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      showError('Missing Information', 'Please provide both title and PDF file');
      return;
    }

    // Set password protection flag based on whether password was provided
    const hasPassword = password.trim().length > 0;

    try {
      setUploading(true);
      console.log('📤 Uploading PDF to R2...');
      console.log('🔒 Password provided:', hasPassword);
      info('Uploading PDF', 'Uploading your lecture PDF to storage...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (hasPassword) {
        formData.append('password', password);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lecture/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload PDF');
      }

      console.log('✅ PDF uploaded successfully:', result.pdfUrl);
      console.log('🔐 Password Protected:', result.isPasswordProtected);
      success('PDF Uploaded!', 'Your lecture PDF has been uploaded successfully');

      onComplete({
        pdfUrl: result.pdfUrl,
        title,
        isPasswordProtected: result.isPasswordProtected,
        password: hasPassword ? password : undefined,
      });
    } catch (err) {
      console.error('❌ PDF upload failed:', err);
      showError('Upload Failed', err instanceof Error ? err.message : 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Lecture PDF
      </h3>

      {/* Security Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Security Recommendation</p>
            <p className="text-sm text-blue-800 mt-1">
              For enhanced security, we recommend uploading password-protected PDFs. This ensures your content remains secure.
            </p>
          </div>
        </div>
      </div>

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lecture Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Introduction to Data Analytics"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading}
        />
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PDF File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {!file ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600 mb-2">Click to upload PDF</p>
              <p className="text-xs text-gray-500">PDF files only (max 6GB)</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Select PDF
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setIsPasswordProtected(false);
                  setShowPasswordInput(false);
                  setPassword('');
                }}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Input - Always show */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PDF Password (Optional)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setIsPasswordProtected(e.target.value.trim().length > 0);
          }}
          placeholder="Enter PDF password if protected"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty if PDF is not password protected
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || !file || !title.trim()}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>
    </div>
  );
}

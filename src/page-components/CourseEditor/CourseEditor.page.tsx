'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Course, CourseStatus, CourseLevel } from '@/types/course';
import { Header } from '@/components/layout/Header';
import { Input, Textarea, Alert } from '@/components/ui';
import { useNotifications } from '@/contexts/NotificationContext';
import { VideoUploaderWithProcessing } from '@/components/features/VideoUploader/VideoUploaderWithProcessing';
import { PDFUploader } from '@/components/features/LectureUploader/PDFUploader';
import type { VideoMetadata } from '@/types/video-processing.types';

// Dynamic import for PDFViewer to prevent SSR issues
const PDFViewerSimple = dynamic(
  () => import('@/components/features/LectureUploader/PDFViewerSimple').then(mod => mod.PDFViewerSimple),
  { ssr: false }
);

interface CourseEditorPageProps {
  course?: Course;
  onSave: (data: any, status: CourseStatus) => Promise<{ success: boolean; error?: string; data?: Course }>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Editor-specific types matching frontend structure
interface EditorModule {
  id: string;
  title: string;
  items: VideoItem[];
}

interface VideoItem {
  id: string;
  title: string;
  contentType: 'VIDEO' | 'PDF'; // Content type
  videoUrl?: string;
  videoType?: 'UPLOAD' | 'YOUTUBE';
  description?: string;
  
  // Video-specific fields (HLS support)
  _r2VideoUrls?: Record<string, string>; // HLS playlist URLs per quality (from backend)
  _r2MasterPlaylist?: string; // HLS master playlist URL (from backend)
  _r2Thumbnail?: string; // R2 uploaded thumbnail URL (from backend)
  _r2Metadata?: { originalWidth: number; originalHeight: number; duration: number }; // R2 video metadata
  
  // PDF-specific fields
  pdfUrl?: string; // R2 URL for PDF
  pdfPassword?: string; // Password for protected PDFs
  isPasswordProtected?: boolean;
}

interface EditorFaq {
  question: string;
  answer: string;
}

export function CourseEditorPage({ course, onSave, onCancel, isLoading }: CourseEditorPageProps) {
  const [currentStatus, setCurrentStatus] = useState<CourseStatus>(course?.status || CourseStatus.DRAFT);
  const { success, error, warning, info } = useNotifications();
  
  // Hero Section Data (matches CourseHeroSection)
  const [heroData, setHeroData] = useState({
    badge: course?.category || '',
    headline: course?.title || '',
    subheadline: course?.description || '',
    price: course?.price?.toString() || '',
    spotsLeft: course?.spotsLeft || 7, // Default value
    nextCohort: course?.nextCohort || 'Next batch starting soon (date TBC)', // Default value
    checkoutUrl: '', // Admin can set this
    highlights: course?.features || ['']
  });

  // Program Outcomes (matches ProgramOutcomeSection)
  const [outcomes, setOutcomes] = useState<string[]>(course?.outcomes || ['']);

  // Modules & Curriculum (matches ProgramOutcomeSection modules)
  const convertToEditorModules = (): EditorModule[] => {
    if (course?.modules && course.modules.length > 0) {
      return course.modules.map(module => ({
        id: module.id,
        title: module.title,
        items: module.lessons?.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          contentType: (lesson.contentType as 'VIDEO' | 'PDF') || 'VIDEO',
          videoUrl: lesson.videoUrl || '',
          videoType: (lesson.videoType as 'UPLOAD' | 'YOUTUBE') || 'UPLOAD',
          description: lesson.description || '',
          // Load existing HLS data from database
          _r2VideoUrls: lesson.hlsQualities as Record<string, string> | undefined,
          _r2MasterPlaylist: lesson.hlsMasterPlaylist,
          _r2Thumbnail: lesson.thumbnail,
          _r2Metadata: lesson.originalWidth && lesson.originalHeight && lesson.videoDuration ? {
            originalWidth: lesson.originalWidth,
            originalHeight: lesson.originalHeight,
            duration: lesson.videoDuration,
          } : undefined,
          // PDF fields
          pdfUrl: lesson.pdfUrl,
          pdfPassword: lesson.pdfPassword,
          isPasswordProtected: lesson.isPasswordProtected || false
        })) || [{ 
          id: `default_${Date.now()}`, 
          title: 'Add your first video',
          contentType: 'VIDEO' as const,
          videoUrl: '',
          videoType: 'UPLOAD' as const,
          description: ''
        }]
      }));
    }
    return [{
      id: '1',
      title: 'Module 1: Foundations',
      items: [{ 
        id: `default_${Date.now()}`, 
        title: 'Add your first video',
        contentType: 'VIDEO' as const,
        videoUrl: '',
        videoType: 'UPLOAD' as const,
        description: ''
      }]
    }];
  };

  const [modules, setModules] = useState<EditorModule[]>(convertToEditorModules());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(['1'])); // First module open by default

  // FAQs (matches CareerSupportSection)
  const [faqs, setFaqs] = useState<EditorFaq[]>(
    course?.faqs || [{ question: '', answer: '' }]
  );
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set([0])); // First FAQ open by default

  // Video Upload State
  const [showVideoUploader, setShowVideoUploader] = useState<{ moduleIndex: number; itemIndex: number; title: string } | null>(null);
  
  // PDF Lecture Upload State
  const [showPDFUploader, setShowPDFUploader] = useState<{ moduleIndex: number; itemIndex: number } | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState<{ pdfUrl: string; password?: string; title: string } | null>(null);
  const [showYouTubePreview, setShowYouTubePreview] = useState<{ videoUrl: string; title: string } | null>(null);

  const handleSave = async (status: CourseStatus = currentStatus) => {
    try {
      console.log('=== SAVING COURSE ===');
      console.log('Current modules state:', modules);
      
      // STEP 1: Upload videos to R2 FIRST (before creating course)
      const modulesWithUploadedVideos = [...modules];
      
      for (let moduleIndex = 0; moduleIndex < modulesWithUploadedVideos.length; moduleIndex++) {
        const module = modulesWithUploadedVideos[moduleIndex];
        
        for (let itemIndex = 0; itemIndex < module.items.length; itemIndex++) {
          const item = module.items[itemIndex];
          
          // Backend processing - videos are already uploaded and processed
          // No need to upload here, backend handles everything
          // Just keep the items as-is
        }
      }
      
      // Update state with uploaded videos
      setModules(modulesWithUploadedVideos);
      
      // STEP 2: Create course with real R2 URLs
      const courseData = {
        title: heroData.headline,
        description: heroData.subheadline,
        category: heroData.badge,
        price: parseFloat(heroData.price) || 0,
        spotsLeft: heroData.spotsLeft,
        nextCohort: heroData.nextCohort,
        duration: '8 weeks',
        level: CourseLevel.BEGINNER,
        thumbnail: 'https://via.placeholder.com/400x300',
        instructor: 'TBD',
        features: heroData.highlights.filter(h => h.trim()),
        outcomes: outcomes.filter(o => o.trim()),
        modules: modulesWithUploadedVideos.map(module => ({
          title: module.title,
          description: `Module covering: ${module.items.map(item => item.title).join(', ')}`,
          duration: '1 week',
          order: modulesWithUploadedVideos.indexOf(module) + 1,
          lessons: module.items.map((item, index) => {
            console.log(`🔍 Mapping lesson ${index + 1}:`, item.title);
            console.log('   item._r2VideoUrls:', item._r2VideoUrls);
            console.log('   item._r2MasterPlaylist:', item._r2MasterPlaylist);
            console.log('   item._r2Thumbnail:', item._r2Thumbnail);
            console.log('   item._r2Metadata:', item._r2Metadata);
            
            const lessonPayload = {
              title: item.title,
              description: item.description || `Lesson about ${item.title}`,
              duration: '1 hour',
              order: index + 1,
              
              // Content type
              contentType: item.contentType || 'VIDEO',
              
              // Video fields - HLS streaming
              videoUrl: item.videoUrl,
              videoType: item.videoType,
              hlsMasterPlaylist: item._r2MasterPlaylist, // HLS master playlist
              hlsQualities: item._r2VideoUrls, // HLS quality playlists (480p, 720p, 1080p)
              thumbnail: item._r2Thumbnail,
              originalWidth: item._r2Metadata?.originalWidth,
              originalHeight: item._r2Metadata?.originalHeight,
              videoDuration: item._r2Metadata?.duration,
              
              // PDF fields
              pdfUrl: item.pdfUrl,
              pdfPassword: item.pdfPassword,
              isPasswordProtected: item.isPasswordProtected || false,
            };
            
            console.log('📤 Lesson payload being sent:', lessonPayload);
            
            return lessonPayload;
          })
        })),
        faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
        status: status
      };
      
      console.log('Course data being sent to API:', courseData);
      
      const result = await onSave(courseData, status);
      
      console.log('Save result:', result);
      
      if (result.success) {
        setCurrentStatus(status);
        success(
          'Course Saved Successfully!',
          `Course ${status === CourseStatus.PUBLISHED ? 'published' : 'saved as draft'} successfully!`
        );
      } else {
        error(
          'Failed to Save Course',
          result.error || 'An unknown error occurred while saving the course',
          {
            action: {
              label: 'Retry',
              onClick: () => handleSave(status)
            }
          }
        );
      }
    } catch (err) {
      console.error('Failed to save course:', err);
      error(
        'Save Error',
        err instanceof Error ? err.message : 'An unexpected error occurred',
        {
          action: {
            label: 'Retry',
            onClick: () => handleSave(status)
          }
        }
      );
    }
  };

  // Hero Section Handlers
  const updateHeroData = (field: string, value: any) => {
    setHeroData(prev => ({ ...prev, [field]: value }));
  };

  const addHighlight = () => {
    setHeroData(prev => ({ ...prev, highlights: [...prev.highlights, ''] }));
  };

  const updateHighlight = (index: number, value: string) => {
    const updated = [...heroData.highlights];
    updated[index] = value;
    setHeroData(prev => ({ ...prev, highlights: updated }));
  };

  const removeHighlight = (index: number) => {
    if (heroData.highlights.length > 1) {
      const updated = heroData.highlights.filter((_, i) => i !== index);
      setHeroData(prev => ({ ...prev, highlights: updated }));
    }
  };

  // Outcomes Handlers
  const addOutcome = () => setOutcomes([...outcomes, '']);
  const updateOutcome = (index: number, value: string) => {
    const updated = [...outcomes];
    updated[index] = value;
    setOutcomes(updated);
  };
  const removeOutcome = (index: number) => {
    if (outcomes.length > 1) {
      setOutcomes(outcomes.filter((_, i) => i !== index));
    }
  };

  // Module Handlers
  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const newSet = new Set<string>(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const addModule = () => {
    const newModuleId = Date.now().toString();
    const newModule: EditorModule = {
      id: newModuleId,
      title: `Module ${modules.length + 1}: `,
      items: [{ 
        id: '1', 
        title: 'First video lesson',
        contentType: 'VIDEO'
      }]
    };
    setModules([...modules, newModule]);
    // Open the new module by default
    setOpenModules(prev => {
      const newSet = new Set<string>(prev);
      newSet.add(newModuleId);
      return newSet;
    });
  };

  const updateModuleTitle = (index: number, title: string) => {
    const updated = [...modules];
    updated[index].title = title;
    setModules(updated);
  };

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      const moduleToRemove = modules[index];
      setModules(modules.filter((_, i) => i !== index));
      // Remove from openModules set
      setOpenModules(prev => {
        const newSet = new Set<string>(prev);
        newSet.delete(moduleToRemove.id);
        return newSet;
      });
    }
  };

  const removeModuleItem = (moduleIndex: number, itemIndex: number) => {
    const updated = [...modules];
    if (updated[moduleIndex].items.length > 1) {
      updated[moduleIndex].items = updated[moduleIndex].items.filter((_, i) => i !== itemIndex);
      setModules(updated);
    }
  };

  // Video Upload Handler - NEW: Uses VideoUploaderWithProcessing
  const handleVideoComplete = (
    moduleIndex: number,
    itemIndex: number,
    data: {
      videoUrls?: Record<string, string>;
      thumbnailUrl?: string;
      masterPlaylistUrl?: string;
      metadata?: VideoMetadata;
      videoType: 'UPLOAD' | 'YOUTUBE';
      youtubeUrl?: string;
    }
  ) => {
    console.log('=== VIDEO COMPLETE ===');
    console.log('Module Index:', moduleIndex);
    console.log('Item Index:', itemIndex);
    console.log('Video Type:', data.videoType);
    console.log('Data:', data);

    const updated = [...modules];
    const title = showVideoUploader?.title || 'Untitled Video';

    if (data.videoType === 'YOUTUBE') {
      // YouTube video
      const videoItem: VideoItem = {
        id: `video_${Date.now()}`,
        title,
        contentType: 'VIDEO',
        description: '',
        videoUrl: data.youtubeUrl || '',
        videoType: 'YOUTUBE',
      };
      
      console.log('📺 YouTube video item created:', videoItem);

      if (itemIndex >= updated[moduleIndex].items.length) {
        updated[moduleIndex].items.push(videoItem);
      } else {
        updated[moduleIndex].items[itemIndex] = videoItem;
      }

      setModules(updated);
      setShowVideoUploader(null);

      success(
        'YouTube Video Added!',
        `YouTube video "${title}" has been added. It will be saved when you publish the course.`,
        { duration: 5000 }
      );
    } else {
      // Uploaded video
      const videoItem: VideoItem = {
        id: `video_${Date.now()}`,
        title,
        contentType: 'VIDEO',
        description: '',
        videoUrl: 'processed', // Placeholder - video is processed and in R2
        videoType: 'UPLOAD',
        _r2VideoUrls: data.videoUrls, // HLS quality playlists
        _r2MasterPlaylist: data.masterPlaylistUrl, // HLS master playlist
        _r2Thumbnail: data.thumbnailUrl,
        _r2Metadata: data.metadata ? {
          originalWidth: data.metadata.width,
          originalHeight: data.metadata.height,
          duration: data.metadata.duration,
        } : undefined,
      };
      
      console.log('🎥 Upload video item created:', videoItem);

      if (itemIndex >= updated[moduleIndex].items.length) {
        updated[moduleIndex].items.push(videoItem);
      } else {
        updated[moduleIndex].items[itemIndex] = videoItem;
      }

      setModules(updated);
      setShowVideoUploader(null);

      success(
        'Video Processed Successfully!',
        `Video "${title}" has been processed with HLS streaming. It will be saved to database when you publish the course.`,
        { duration: 5000 }
      );
    }
  };

  // PDF Upload Handler - NEW: Handles PDF lecture uploads
  const handlePDFComplete = (data: {
    pdfUrl: string;
    title: string;
    isPasswordProtected: boolean;
    password?: string;
  }) => {
    if (!showPDFUploader) return;

    console.log('=== PDF UPLOAD COMPLETE ===');
    console.log('PDF URL:', data.pdfUrl);
    console.log('Password Protected:', data.isPasswordProtected);

    const { moduleIndex, itemIndex } = showPDFUploader;
    const updated = [...modules];

    const pdfItem: VideoItem = {
      id: `pdf_${Date.now()}`,
      title: data.title,
      contentType: 'PDF',
      pdfUrl: data.pdfUrl,
      isPasswordProtected: data.isPasswordProtected,
      pdfPassword: data.password,
    };

    if (itemIndex >= updated[moduleIndex].items.length) {
      updated[moduleIndex].items.push(pdfItem);
    } else {
      updated[moduleIndex].items[itemIndex] = pdfItem;
    }

    console.log('Updated modules after PDF upload:', updated);

    setModules(updated);
    setShowPDFUploader(null);

    success(
      'PDF Uploaded Successfully!',
      `Lecture "${data.title}" has been uploaded to R2. It will be saved to database when you publish the course.`,
      { duration: 5000 }
    );
  };

  // FAQ Handlers
  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => {
      const newSet = new Set<number>(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const addFaq = () => {
    const newIndex = faqs.length;
    setFaqs([...faqs, { question: '', answer: '' }]);
    // Open the new FAQ by default
    setOpenFaqs(prev => {
      const newSet = new Set<number>(prev);
      newSet.add(newIndex);
      return newSet;
    });
  };
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };
  const removeFaq = (index: number) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((_, i) => i !== index));
      // Remove from openFaqs set and adjust indices
      setOpenFaqs(prev => {
        const newSet = new Set<number>();
        prev.forEach(i => {
          if (i < index) {
            newSet.add(i);
          } else if (i > index) {
            newSet.add(i - 1);
          }
        });
        return newSet;
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />
      
      {/* Save/Cancel Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {course ? 'Edit Course' : 'Create New Course'}
                </h1>
                {course && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentStatus === CourseStatus.PUBLISHED 
                      ? 'bg-green-100 text-green-800' 
                      : currentStatus === CourseStatus.DRAFT
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {currentStatus}
                  </span>
                )}
              </div>
              <p className="text-gray-600">Configure course details exactly like the frontend page</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSave(CourseStatus.DRAFT)} 
                disabled={isLoading}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Draft'}
              </button>
              <button 
                onClick={() => handleSave(CourseStatus.PUBLISHED)} 
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Course Program Hero Section - EDITABLE */}
      <section style={{ padding: '80px 5vw', background: '#fff' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '34px', 
          alignItems: 'center' 
        }} className="responsive-grid">
          <div>
            {/* Badge - LEFT ALIGNED like frontend */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '0.72rem', 
                fontWeight: '600', 
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#0ea5e9',
                marginBottom: '14px'
              }}>
                <div style={{
                  content: '',
                  display: 'block',
                  width: '18px',
                  height: '1.5px',
                  background: '#0ea5e9',
                  borderRadius: '2px'
                }}></div>
                <Input
                  value={heroData.badge}
                  onChange={(e) => updateHeroData('badge', e.target.value)}
                  placeholder="DATA ANALYTICS PROGRAM"
                  className="bg-transparent border-none p-0"
                  style={{ 
                    color: '#0ea5e9',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: '16px' }}>
              <Input
                value={heroData.headline}
                onChange={(e) => updateHeroData('headline', e.target.value)}
                placeholder="Become a Job-Ready Data Analyst"
                className="bg-transparent border-none p-0 w-full"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)',
                  fontWeight: '700',
                  lineHeight: '1.2',
                  letterSpacing: '-0.3px',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Subheadline */}
            <div style={{ marginBottom: '32px' }}>
              <Textarea
                value={heroData.subheadline}
                onChange={(e) => updateHeroData('subheadline', e.target.value)}
                placeholder="Designed to transform beginners and professionals into industry-ready Data Analysts capable of working with real-world business data and modern analytics tools."
                rows={3}
                className="bg-transparent border-none p-0 resize-none w-full"
                style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  color: '#64748b',
                  maxWidth: '540px'
                }}
              />
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', fontSize: '0.9rem' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>SPOTS LEFT</p>
                <Input
                  value={heroData.spotsLeft.toString()}
                  onChange={(e) => updateHeroData('spotsLeft', parseInt(e.target.value) || 0)}
                  placeholder="7"
                  className="bg-transparent border-none p-0"
                  style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', width: '40px' }}
                />
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>NEXT COHORT</p>
                <Input
                  value={heroData.nextCohort}
                  onChange={(e) => updateHeroData('nextCohort', e.target.value)}
                  placeholder="Next batch starting soon (date TBC)"
                  className="bg-transparent border-none p-0"
                  style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', minWidth: '250px' }}
                />
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>PRICE</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>£</span>
                  <Input
                    value={heroData.price}
                    onChange={(e) => updateHeroData('price', e.target.value)}
                    placeholder="999"
                    className="bg-transparent border-none p-0"
                    style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', width: '60px' }}
                  />
                </div>
              </div>
            </div>

            {/* Highlights Tags */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ color: '#64748b', fontSize: '0.9rem' }}>Course Highlights</label>
                <button 
                  onClick={addHighlight}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {heroData.highlights.map((highlight, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: '500',
                      letterSpacing: '0.4px',
                      padding: '3px 10px',
                      background: '#eef0f5',
                      color: '#64748b',
                      borderRadius: '100px'
                    }}>
                      <Input
                        value={highlight}
                        onChange={(e) => updateHighlight(index, e.target.value)}
                        placeholder="SQL"
                        className="bg-transparent border-none p-0 text-center min-w-12"
                        style={{ 
                          color: '#64748b',
                          fontSize: '0.72rem',
                          fontWeight: '500',
                          letterSpacing: '0.4px'
                        }}
                      />
                    </div>
                    {heroData.highlights.length > 1 && (
                      <button 
                        onClick={() => removeHighlight(index)}
                        className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button style={{
                background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                Pay Now
              </button>
              <button style={{
                border: '1px solid #e2e8f0',
                color: '#64748b',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '500',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                Talk to us first
              </button>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto 0 auto' }}>
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>RESERVE YOUR SEAT</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>£</span>
                    <Input
                      value={heroData.price}
                      onChange={(e) => updateHeroData('price', e.target.value)}
                      placeholder="999"
                      className="border-none p-0 text-center"
                      style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', width: '80px' }}
                    />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Seats are limited to keep mentoring quality high</p>
                </div>
                
                <button style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '16px'
                }}>
                  Pay Now
                </button>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                  {['Career support included', 'Portfolio projects', 'Interview prep'].map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: '#10b981',
                        borderRadius: '50%',
                        marginRight: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg style={{ width: '8px', height: '8px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Program Outcome & Curriculum Section - EDITABLE */}
      <section style={{ padding: '80px 5vw', background: '#f7f8fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '34px' }} className="responsive-grid">
          {/* Program Outcomes */}
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.72rem', 
              fontWeight: '600', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#0ea5e9',
              marginBottom: '14px'
            }}>
              <div style={{
                content: '',
                display: 'block',
                width: '18px',
                height: '1.5px',
                background: '#0ea5e9',
                borderRadius: '2px'
              }}></div>
              Program Outcome
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)',
                fontWeight: '700',
                lineHeight: '1.2',
                letterSpacing: '-0.3px',
                color: '#0f172a',
                margin: 0
              }}>What you'll be able to do</h2>
              <button 
                onClick={addOutcome}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                +
              </button>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {outcomes.map((outcome, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%', flexShrink: 0, marginTop: '8px' }}></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Input
                      value={outcome}
                      onChange={(e) => updateOutcome(index, e.target.value)}
                      placeholder="Query and analyse data using SQL"
                      className="flex-1 border-none p-0"
                      style={{ color: '#64748b', lineHeight: '1.6', width: '100%' }}
                    />
                    {outcomes.length > 1 && (
                      <button 
                        onClick={() => removeOutcome(index)}
                        className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs transition-colors flex-shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.72rem', 
              fontWeight: '600', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#0ea5e9',
              marginBottom: '14px'
            }}>
              <div style={{
                content: '',
                display: 'block',
                width: '18px',
                height: '1.5px',
                background: '#0ea5e9',
                borderRadius: '2px'
              }}></div>
              Curriculum
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)',
                fontWeight: '700',
                lineHeight: '1.2',
                letterSpacing: '-0.3px',
                color: '#0f172a',
                margin: 0
              }}>Modules & projects</h2>
              <button 
                onClick={addModule}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                + Add Module
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              {modules.map((module, moduleIndex) => {
                const isOpen = openModules.has(module.id);
                return (
                  <div key={module.id} style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px'
                  }}>
                    <div 
                      style={{ 
                        cursor: 'pointer',
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => toggleModule(module.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ 
                          color: '#94a3b8', 
                          fontSize: '0.9rem',
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>▶</span>
                        <Input
                          value={module.title}
                          onChange={(e) => updateModuleTitle(moduleIndex, e.target.value)}
                          placeholder="Module 1: Foundations of Data Analytics"
                          className="bg-transparent border-none p-0 flex-1"
                          style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {modules.length > 1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeModule(moduleIndex);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded text-xs transition-colors ml-2 flex-shrink-0"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {isOpen && (
                      <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>Module Content</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => {
                                const title = prompt('Enter video title:');
                                if (title) {
                                  setShowVideoUploader({ moduleIndex, itemIndex: module.items.length, title });
                                }
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              + Add Video
                            </button>
                            <button 
                              onClick={() => {
                                setShowPDFUploader({ moduleIndex, itemIndex: module.items.length });
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              + Add Lecture
                            </button>
                          </div>
                        </div>
                        <ul style={{ listStyleType: 'disc', color: '#64748b' }}>
                          {module.items.map((item, itemIndex) => (
                            <li key={itemIndex} style={{ 
                              color: '#64748b', 
                              lineHeight: '1.5', 
                              fontSize: '0.9rem', 
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              {/* PDF Content */}
                              {item.contentType === 'PDF' && item.pdfUrl ? (
                                <button
                                  onClick={() => {
                                    setShowPDFViewer({
                                      pdfUrl: item.pdfUrl!,
                                      password: item.pdfPassword,
                                      title: item.title
                                    });
                                  }}
                                  className="flex-1 text-left border-none p-0 bg-transparent hover:text-blue-600 transition-colors cursor-pointer"
                                  style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}
                                >
                                  📄 {item.title} {item.isPasswordProtected && '🔒'}
                                </button>
                              ) : 
                              /* Video Content */
                              item.contentType === 'VIDEO' && item.videoUrl && !item.videoUrl.startsWith('temp://') ? (
                                <button
                                  onClick={() => {
                                    // For YouTube videos, show preview modal (works for both saved and unsaved)
                                    if (item.videoType === 'YOUTUBE') {
                                      setShowYouTubePreview({
                                        videoUrl: item.videoUrl,
                                        title: item.title
                                      });
                                    } else {
                                      // For uploaded videos, just open by ID (fetch from API)
                                      window.open(`/video-player/${item.id}`, '_blank');
                                    }
                                  }}
                                  className="flex-1 text-left border-none p-0 bg-transparent hover:text-blue-600 transition-colors cursor-pointer"
                                  style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}
                                >
                                  {item.videoType === 'YOUTUBE' ? '📺' : '🎥'} {item.title}
                                </button>
                              ) : item.videoUrl?.startsWith('temp://') ? (
                                <span className="flex-1 text-orange-500" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                  📁 {item.title} (Ready to upload)
                                </span>
                              ) : (
                                <span className="flex-1 text-gray-400" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                  📝 {item.title} (No content uploaded)
                                </span>
                              )}
                              {module.items.length > 1 && (
                                <button 
                                  onClick={() => removeModuleItem(moduleIndex, itemIndex)}
                                  className="bg-red-500 hover:bg-red-600 text-white w-4 h-4 rounded text-xs transition-colors flex-shrink-0"
                                >
                                  ×
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Career Support & FAQs Section - EDITABLE */}
      <section style={{ padding: '80px 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '34px' }} className="responsive-grid">
          {/* Career Support */}
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.72rem', 
              fontWeight: '600', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#0ea5e9',
              marginBottom: '14px'
            }}>
              <div style={{
                content: '',
                display: 'block',
                width: '18px',
                height: '1.5px',
                background: '#0ea5e9',
                borderRadius: '2px'
              }}></div>
              Career Support
            </div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)',
              fontWeight: '700',
              lineHeight: '1.2',
              letterSpacing: '-0.3px',
              color: '#0f172a',
              marginBottom: '16px'
            }}>We support you until job placement</h2>
            <ul style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Resume optimisation',
                'LinkedIn branding',
                'Portfolio website creation',
                'GitHub project portfolio',
                'Technical interview preparation',
                'Competency-based interview coaching',
                'Mock interviews'
              ].map((item, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%', flexShrink: 0 }}></div>
                  <span style={{ color: '#64748b', lineHeight: '1.6' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQs */}
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.72rem', 
              fontWeight: '600', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#0ea5e9',
              marginBottom: '14px'
            }}>
              <div style={{
                content: '',
                display: 'block',
                width: '18px',
                height: '1.5px',
                background: '#0ea5e9',
                borderRadius: '2px'
              }}></div>
              FAQs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)',
                fontWeight: '700',
                lineHeight: '1.2',
                letterSpacing: '-0.3px',
                color: '#0f172a',
                margin: 0
              }}>Quick answers</h2>
              <button 
                onClick={addFaq}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                + Add FAQ
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              {faqs.map((faq, index) => {
                const isOpen = openFaqs.has(index);
                return (
                  <div key={index} style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px'
                  }}>
                    <div 
                      style={{ 
                        cursor: 'pointer',
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => toggleFaq(index)}
                    >
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                        placeholder="Do I need prior experience?"
                        className="bg-transparent border-none p-0 flex-1"
                        style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {faqs.length > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFaq(index);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded text-xs transition-colors flex-shrink-0"
                          >
                            ×
                          </button>
                        )}
                        <span style={{ 
                          color: '#94a3b8', 
                          fontSize: '0.9rem',
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>▶</span>
                      </div>
                    </div>
                    
                    {isOpen && (
                      <div style={{ marginTop: '10px' }}>
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                          placeholder="No. We start from fundamentals and ramp up to job-ready skills with projects."
                          rows={2}
                          className="w-full border-none p-0"
                          style={{ color: '#64748b', lineHeight: '1.6' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Video Upload Modal - NEW: Quality Selection Flow */}
      {showVideoUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <VideoUploaderWithProcessing
              lessonId={`temp_${Date.now()}`}
              lessonName={showVideoUploader.title}
              onComplete={(data) => handleVideoComplete(
                showVideoUploader.moduleIndex,
                showVideoUploader.itemIndex,
                data
              )}
              onCancel={() => setShowVideoUploader(null)}
            />
          </div>
        </div>
      )}

      {/* PDF Upload Modal - NEW: PDF Lecture Upload */}
      {showPDFUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <PDFUploader
              onComplete={handlePDFComplete}
              onCancel={() => setShowPDFUploader(null)}
            />
          </div>
        </div>
      )}

      {/* PDF Viewer Modal - NEW: View PDF Lectures */}
      {showPDFViewer && typeof window !== 'undefined' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {showPDFViewer.title}
              </h3>
              <button
                onClick={() => setShowPDFViewer(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewerSimple
                pdfUrl={showPDFViewer.pdfUrl}
                password={showPDFViewer.password}
                title={showPDFViewer.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* YouTube Preview Modal - NEW: Preview YouTube videos before publishing */}
      {showYouTubePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📺 {showYouTubePreview.title}
              </h3>
              <button
                onClick={() => setShowYouTubePreview(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="w-full" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={(() => {
                    // Convert YouTube URL to embed format
                    let videoId = '';
                    const url = showYouTubePreview.videoUrl;
                    
                    if (url.includes('youtube.com/watch?v=')) {
                      videoId = url.split('v=')[1].split('&')[0];
                    } else if (url.includes('youtu.be/')) {
                      videoId = url.split('youtu.be/')[1].split('?')[0];
                    } else if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
                      videoId = url.split('/embed/')[1].split('?')[0];
                    }
                    
                    return `https://www.youtube-nocookie.com/embed/${videoId}`;
                  })()}
                  title={showYouTubePreview.title}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                This is a preview. The video will be saved to the database when you publish the course.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add responsive CSS
const styles = `
  .responsive-grid {
    grid-template-columns: 1fr 1fr !important;
  }
  
  @media (max-width: 900px) {
    .responsive-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
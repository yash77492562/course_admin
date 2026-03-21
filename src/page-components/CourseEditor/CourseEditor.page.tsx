'use client';

import { useState } from 'react';
import { Course, CourseStatus, CourseLevel } from '@/types/course';
import { Header } from '@/components/layout/Header';
import { Input, Textarea, Alert } from '@/components/ui';

interface CourseEditorPageProps {
  course?: Course;
  onSave: (data: any, status: CourseStatus) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Editor-specific types matching frontend structure
interface EditorModule {
  id: string;
  title: string;
  items: string[];
}

interface EditorFaq {
  question: string;
  answer: string;
}

export function CourseEditorPage({ course, onSave, onCancel, isLoading }: CourseEditorPageProps) {
  const [successMessage, setSuccessMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState<CourseStatus>(course?.status || CourseStatus.DRAFT);
  
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
        items: module.lessons?.map(lesson => lesson.title) || ['']
      }));
    }
    return [{
      id: '1',
      title: 'Module 1: Foundations',
      items: ['Introduction lesson']
    }];
  };

  const [modules, setModules] = useState<EditorModule[]>(convertToEditorModules());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(['1'])); // First module open by default

  // FAQs (matches CareerSupportSection)
  const [faqs, setFaqs] = useState<EditorFaq[]>(
    course?.faqs || [{ question: '', answer: '' }]
  );
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set([0])); // First FAQ open by default

  const handleSave = async (status: CourseStatus = currentStatus) => {
    try {
      const result = await onSave({
        title: heroData.headline,
        description: heroData.subheadline,
        category: heroData.badge,
        price: parseFloat(heroData.price) || 0,
        spotsLeft: heroData.spotsLeft,
        nextCohort: heroData.nextCohort,
        duration: '8 weeks', // Default duration
        level: CourseLevel.BEGINNER, // Default level - required field
        thumbnail: 'https://via.placeholder.com/400x300', // Default thumbnail - required field
        instructor: 'TBD', // Default instructor
        features: heroData.highlights.filter(h => h.trim()),
        outcomes: outcomes.filter(o => o.trim()),
        modules: modules.map(module => ({
          title: module.title,
          description: `Module covering: ${module.items.join(', ')}`,
          duration: '1 week',
          order: modules.indexOf(module) + 1,
          lessons: module.items.filter(item => item.trim()).map((item, index) => ({
            title: item,
            description: `Lesson about ${item}`,
            duration: '1 hour',
            order: index + 1
          }))
        })),
        faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
        status: status
      }, status);
      
      if (result.success) {
        setCurrentStatus(status);
        setSuccessMessage(`Course ${status === CourseStatus.PUBLISHED ? 'published' : 'saved as draft'} successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save course:', error);
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
      items: ['']
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

  const addModuleItem = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].items.push('');
    setModules(updated);
  };

  const updateModuleItem = (moduleIndex: number, itemIndex: number, value: string) => {
    const updated = [...modules];
    updated[moduleIndex].items[itemIndex] = value;
    setModules(updated);
  };

  const removeModuleItem = (moduleIndex: number, itemIndex: number) => {
    const updated = [...modules];
    if (updated[moduleIndex].items.length > 1) {
      updated[moduleIndex].items = updated[moduleIndex].items.filter((_, i) => i !== itemIndex);
      setModules(updated);
    }
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
      
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert variant="success">{successMessage}</Alert>
        </div>
      )}

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
                          <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>Module Items</label>
                          <button 
                            onClick={() => addModuleItem(moduleIndex)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          >
                            + Add Item
                          </button>
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
                              <Input
                                value={item}
                                onChange={(e) => updateModuleItem(moduleIndex, itemIndex, e.target.value)}
                                placeholder="Introduction to the Data Analytics lifecycle"
                                className="flex-1 border-none p-0"
                                style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}
                              />
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
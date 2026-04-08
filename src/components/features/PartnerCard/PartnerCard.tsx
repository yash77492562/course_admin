'use client';

import { useState } from 'react';
import { Partner } from '@/lib/api/partnerApi';

interface PartnerCardProps {
  partner: Partner;
  onStatusChange: (id: string, status: string) => void;
}

export function PartnerCard({ partner, onStatusChange }: PartnerCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const statusColors = {
    PENDING: 'bg-amber-500',
    REVIEWED: 'bg-blue-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const steps = [
    {
      title: "Full Name",
      content: partner.name,
    },
    {
      title: "Email Address",
      content: partner.email,
    },
    ...(partner.phone ? [{
      title: "Phone Number",
      content: partner.phone,
    }] : []),
    {
      title: "Current Role",
      content: partner.role,
    },
    {
      title: "Area of Expertise",
      content: partner.expertise,
    },
    {
      title: "Years of Experience",
      content: partner.experience,
    },
    ...(partner.linkedIn ? [{
      title: "LinkedIn Profile",
      content: partner.linkedIn,
      isLink: true,
    }] : []),
    {
      title: "What would you like to teach?",
      content: partner.teachingInterest,
      isLong: true,
    },
    {
      title: "Tell us more about yourself",
      content: partner.message,
      isLong: true,
    },
    {
      title: "Application Date",
      content: new Date(partner.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentStep(0);
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 h-full flex flex-col"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {partner.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">{partner.email}</p>
            {partner.phone && <p className="text-sm text-gray-600 truncate">{partner.phone}</p>}
          </div>
          <span className={`px-3 py-1 rounded-md text-xs font-medium text-white flex-shrink-0 ml-2 ${statusColors[partner.status]}`}>
            {partner.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <p className="text-sm text-gray-900 truncate">{partner.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Expertise</p>
            <p className="text-sm text-gray-900 truncate">{partner.expertise}</p>
          </div>
        </div>

        <div className="mb-4 flex-1">
          <p className="text-xs text-gray-500 mb-1">Teaching Interest</p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {truncateText(partner.teachingInterest, 100)}
          </p>
        </div>

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
          {new Date(partner.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${statusColors[partner.status]}`}>
                  {partner.status}
                </span>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center mb-8 overflow-hidden">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {steps[currentStep].title}
                </h2>
                <div className={`w-full max-w-lg ${steps[currentStep].isLong ? 'text-left max-h-64 overflow-y-auto' : 'text-center'} px-4`}>
                  {steps[currentStep].isLink ? (
                    <a
                      href={steps[currentStep].content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      {steps[currentStep].content}
                    </a>
                  ) : (
                    <p className={`text-lg text-gray-700 ${steps[currentStep].isLong ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>
                      {steps[currentStep].content}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>

                {currentStep === steps.length - 1 ? (
                  <div className="flex gap-3">
                    {partner.status !== 'REVIEWED' && (
                      <button
                        onClick={() => {
                          onStatusChange(partner.id, 'REVIEWED');
                          handleClose();
                        }}
                        className="px-4 py-3 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        Mark Reviewed
                      </button>
                    )}
                    {partner.status !== 'APPROVED' && (
                      <button
                        onClick={() => {
                          onStatusChange(partner.id, 'APPROVED');
                          handleClose();
                        }}
                        className="px-4 py-3 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {partner.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          onStatusChange(partner.id, 'REJECTED');
                          handleClose();
                        }}
                        className="px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    Continue
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

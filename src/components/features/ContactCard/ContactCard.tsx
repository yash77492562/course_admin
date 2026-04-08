'use client';

import { useState } from 'react';
import { Contact } from '@/lib/api/contactApi';

interface ContactCardProps {
  contact: Contact;
  onStatusChange: (id: string, status: string) => void;
}

export function ContactCard({ contact, onStatusChange }: ContactCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const statusColors = {
    NEW: 'bg-blue-500',
    IN_PROGRESS: 'bg-amber-500',
    RESPONDED: 'bg-green-500',
    CLOSED: 'bg-gray-500',
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const steps = [
    {
      title: "Contact Name",
      content: contact.name,
    },
    {
      title: "Email Address",
      content: contact.email,
    },
    ...(contact.phone ? [{
      title: "Phone Number",
      content: contact.phone,
    }] : []),
    {
      title: "Subject",
      content: contact.subject,
    },
    {
      title: "Message",
      content: contact.message,
      isLong: true,
    },
    {
      title: "Submission Date",
      content: new Date(contact.createdAt).toLocaleString('en-US', {
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
              {contact.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">{contact.email}</p>
            {contact.phone && <p className="text-sm text-gray-600 truncate">{contact.phone}</p>}
          </div>
          <span className={`px-3 py-1 rounded-md text-xs font-medium text-white flex-shrink-0 ml-2 ${statusColors[contact.status]}`}>
            {contact.status === 'IN_PROGRESS' ? 'IN PROGRESS' : contact.status}
          </span>
        </div>

        <div className="mb-4 flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Subject: {contact.subject}
          </p>
          <p className="text-sm text-gray-600 line-clamp-3">
            {truncateText(contact.message, 120)}
          </p>
        </div>

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
          {new Date(contact.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${statusColors[contact.status]}`}>
                  {contact.status === 'IN_PROGRESS' ? 'IN PROGRESS' : contact.status}
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
                  <p className={`text-lg text-gray-700 ${steps[currentStep].isLong ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>
                    {steps[currentStep].content}
                  </p>
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
                    {contact.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          onStatusChange(contact.id, 'IN_PROGRESS');
                          handleClose();
                        }}
                        className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {contact.status !== 'RESPONDED' && (
                      <button
                        onClick={() => {
                          onStatusChange(contact.id, 'RESPONDED');
                          handleClose();
                        }}
                        className="px-4 py-3 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        Mark Responded
                      </button>
                    )}
                    {contact.status !== 'CLOSED' && (
                      <button
                        onClick={() => {
                          onStatusChange(contact.id, 'CLOSED');
                          handleClose();
                        }}
                        className="px-4 py-3 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors"
                      >
                        Close
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

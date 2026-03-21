import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onCreateCourse?: () => void;
}

export function Header({ title, subtitle, onCreateCourse }: HeaderProps) {
  return (
    <header className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="Riva Data logo"
                  width={34}
                  height={34}
                  className="rounded-lg"
                />
                <span 
                  className="font-syne font-bold text-white"
                  style={{
                    fontSize: '17px',
                    letterSpacing: '0.3px'
                  }}
                >
                  Riva Data
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
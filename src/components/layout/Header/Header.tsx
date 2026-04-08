import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onCreateCourse?: () => void;
}

export function Header({ title, subtitle, onCreateCourse }: HeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Courses' },
    { href: '/user-queries', label: 'User Queries' },
    { href: '/partners', label: 'Partners' },
    { href: '/orders', label: 'Orders' },
    { href: '/payments', label: 'Payments' },
  ];

  return (
    <header className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3">
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
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
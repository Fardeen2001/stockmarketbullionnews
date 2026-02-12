'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import SearchBar from './SearchBar';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/stocks', label: 'Stocks', icon: '📈' },
    { href: '/metals', label: 'Metals', icon: '🥇' },
    { href: '/sharia', label: 'Sharia Stocks', icon: '✨' },
    { href: '/news', label: 'News', icon: '📰' },
  ];

  return (
    <nav className="bg-secondary sticky top-0 z-50 backdrop-blur-xl border-b border-secondary-300 shadow-xl animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          <div className="flex items-center animate-slide-in">
            <Logo />
          </div>
          
          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-2xl hidden lg:block">
            <SearchBar />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2.5 rounded-xl text-sm font-semibold
                    transition-all duration-300 ease-in-out
                    ${isActive 
                      ? 'text-white bg-accent shadow-lg scale-105' 
                      : 'text-primary hover:text-white hover:bg-accent hover:shadow-md hover:scale-105'
                    }
                    animate-fade-in
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                  {isActive && (
                    <span className="absolute inset-0 bg-accent rounded-xl animate-pulse-glow opacity-75"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-accent hover:bg-primary/80 hover:text-accent transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-6 pt-4 animate-fade-in border-t border-secondary-300 mt-2">
            <div className="mb-4">
              <SearchBar />
            </div>
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      px-4 py-3 rounded-xl text-base font-semibold
                      transition-all duration-300 ease-in-out
                      ${isActive 
                        ? 'text-white bg-accent shadow-lg' 
                        : 'text-primary hover:text-white hover:bg-accent hover:shadow-md'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{link.icon}</span>
                      <span>{link.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

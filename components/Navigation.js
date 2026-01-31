'use client';

import Link from 'next/link';
import Logo from './Logo';
import SearchBar from './SearchBar';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/stocks', label: 'Stocks' },
    { href: '/metals', label: 'Metals' },
    { href: '/sharia', label: 'Sharia Stocks' },
    { href: '/news', label: 'News' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 backdrop-blur-lg border-b border-white/20 shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          <div className="flex items-center animate-slide-in">
            <Logo />
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <SearchBar />
          </div>

          <div className="flex space-x-2">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-semibold
                    transition-all duration-300 ease-in-out
                    ${isActive 
                      ? 'text-white bg-gradient-primary shadow-lg scale-105' 
                      : 'text-gray-700 hover:text-white hover:bg-gradient-primary hover:shadow-md'
                    }
                    animate-fade-in
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="relative z-10">{link.label}</span>
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-primary rounded-lg animate-pulse-glow opacity-75"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}

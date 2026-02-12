'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    // Verify authentication
    fetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/admin/login');
        } else {
          setAuthenticated(true);
        }
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/news', label: 'News Articles', icon: '📰' },
    { href: '/admin/stocks', label: 'Stocks', icon: '📈' },
    { href: '/admin/metals', label: 'Metals', icon: '🥇' },
    { href: '/admin/scraped', label: 'Scraped Content', icon: '🔍' },
    { href: '/admin/trends', label: 'Trending Topics', icon: '🔥' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  if (!authenticated) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-accent text-white">
      <div className="p-6 border-b border-accent-300">
        <Logo showText={false} size="sm" />
        <p className="text-sm text-primary mt-2">Admin Panel</p>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-secondary text-white'
                  : 'text-primary hover:bg-accent-300 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-accent-300">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-white hover:bg-accent-300 rounded transition-colors"
        >
          <span className="mr-3">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}

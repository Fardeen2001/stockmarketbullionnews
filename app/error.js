'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-accent mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-accent/80 mb-4">Something went wrong</h2>
        <p className="text-accent/70 mb-8">
          We're sorry, but something unexpected happened. Please try again later.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-300 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-300 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

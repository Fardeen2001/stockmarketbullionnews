import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-accent/80 mb-4">Page Not Found</h2>
        <p className="text-accent/70 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/"
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-300 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/stocks"
            className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-300 transition-colors"
          >
            Browse Stocks
          </Link>
        </div>
      </div>
    </div>
  );
}

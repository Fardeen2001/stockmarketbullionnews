import Image from 'next/image';
import Link from 'next/link';

export default function Logo({ className = '', showText = true, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      {/* Try to use logo.png, fallback to SVG or text */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center bg-blue-600 rounded-lg`}>
        <span className="text-white font-bold text-xs">SMB</span>
      </div>
      {showText && (
        <span className="text-xl md:text-2xl font-bold text-blue-600">
          StockMarket Bullion
        </span>
      )}
    </Link>
  );
}

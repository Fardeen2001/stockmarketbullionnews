import Image from 'next/image';
import Link from 'next/link';

export default function Logo({ className = '', showText = true, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Link href="/" className={`flex items-center space-x-2 md:space-x-3 group ${className}`}>
      {/* Modern logo with gradient */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center bg-accent rounded-xl shadow-lg transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`}>
        <span className="text-white font-bold text-xs md:text-sm">SMB</span>
      </div>
      {showText && (
        <span className="text-lg md:text-xl lg:text-2xl font-bold text-accent group-hover:scale-105 transition-transform duration-300">
          StockMarket Bullion
        </span>
      )}
    </Link>
  );
}

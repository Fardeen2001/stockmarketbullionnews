import Image from 'next/image';
import Link from 'next/link';

export default function Logo({ className = '', showText = true, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
  };

  return (
    <Link href="/" className={`flex items-center space-x-3 group ${className}`}>
      {/* Modern logo with emerald gradient */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`}>
        <span className="text-white font-bold text-xs md:text-sm tracking-tight">SMB</span>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      {showText && (
        <span className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
          StockMarket Bullion
        </span>
      )}
    </Link>
  );
}
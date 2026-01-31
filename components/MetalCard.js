import Link from 'next/link';
import Image from 'next/image';

export default function MetalCard({ metal }) {
  const isPositive = metal.change >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBg = isPositive ? 'bg-green-50' : 'bg-red-50';
  const changeIcon = isPositive ? '↑' : '↓';
  const metalName = metal.metalType.charAt(0).toUpperCase() + metal.metalType.slice(1);
  
  const metalIcons = {
    gold: '🥇',
    silver: '🥈',
    platinum: '💎',
    palladium: '⚡',
  };
  const metalIcon = metalIcons[metal.metalType.toLowerCase()] || '💠';

  return (
    <Link href={`/metals/${metal.metalType}`}>
      <div className="group glass rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer hover-lift border border-white/20 relative overflow-hidden">
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-warning opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl animate-float">{metalIcon}</span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-white transition-colors duration-300">
                  {metalName}
                </h3>
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300">
                {metal.unit === 'per_gram' ? 'Per Gram' : 'Per Ounce'}
              </p>
            </div>
            {metal.imageUrl && (
              <div className="w-16 h-16 relative rounded-xl overflow-hidden shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Image
                  src={metal.imageUrl}
                  alt={metalName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-extrabold text-gray-900 group-hover:text-white transition-colors duration-300">
                ₹{metal.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </span>
              <span className={`text-lg font-bold px-3 py-1 rounded-lg ${changeColor} ${changeBg} group-hover:bg-white/20 group-hover:text-white transition-all duration-300 transform group-hover:scale-110`}>
                {changeIcon} {Math.abs(metal.changePercent || 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 group-hover:text-white/70 transition-colors duration-300 mt-2">
              <span className="inline-block px-2 py-1 bg-gray-100 group-hover:bg-white/20 rounded-md">
                Currency: {metal.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

import Link from 'next/link';
import Image from 'next/image';

export default function MetalCard({ metal }) {
  const isPositive = metal.change >= 0;
  const changeColor = isPositive ? 'text-emerald-600' : 'text-red-600';
  const changeBg = isPositive ? 'bg-emerald-50' : 'bg-red-50';
  const changeIcon = isPositive ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
  const metalName = metal.metalType.charAt(0).toUpperCase() + metal.metalType.slice(1);
  
  const metalGradients = {
    gold: 'from-amber-400 to-yellow-600',
    silver: 'from-primary-300 to-primary-500',
    platinum: 'from-primary-200 to-primary-400',
    palladium: 'from-secondary-400 to-secondary-500',
  };
  
  const metalGradient = metalGradients[metal.metalType.toLowerCase()] || 'from-secondary/60 to-secondary';

  return (
    <Link href={`/metals/${metal.metalType}`}>
      <div className="group bg-secondary/80 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 md:p-8 cursor-pointer hover-lift border border-secondary-300 relative overflow-hidden h-full flex flex-col">
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-warning opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${metalGradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-accent group-hover:text-white transition-colors duration-300">
                    {metalName}
                  </h3>
                  <p className="text-sm text-accent/70 group-hover:text-white/80 transition-colors duration-300 mt-1">
                    {metal.unit === 'per_gram' ? 'Per Gram' : 'Per Ounce'}
                  </p>
                </div>
              </div>
            </div>
            {metal.imageUrl && (
              <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-2xl overflow-hidden shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ml-4 flex-shrink-0">
                <Image
                  src={metal.imageUrl}
                  alt={metalName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-accent group-hover:text-white transition-colors duration-300">
                ₹{metal.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </span>
              <span className={`text-base md:text-lg font-bold px-4 py-2 rounded-xl ${changeColor} ${changeBg} group-hover:bg-white/20 group-hover:text-white transition-all duration-300 transform group-hover:scale-105 flex items-center gap-1`}>
                {changeIcon}
                <span>{Math.abs(metal.changePercent || 0).toFixed(2)}%</span>
              </span>
            </div>
            <div className="text-sm text-accent/70 group-hover:text-white/70 transition-colors duration-300">
              <span className="inline-block px-3 py-1.5 bg-primary group-hover:bg-white/20 rounded-lg font-medium">
                Currency: {metal.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

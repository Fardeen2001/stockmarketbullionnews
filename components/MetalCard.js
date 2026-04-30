import Link from 'next/link';
import Image from 'next/image';

export default function MetalCard({ metal }) {
  const isPositive = metal.change >= 0;
  const changeColorClass = isPositive ? 'text-emerald-400' : 'text-red-400';
  const changeBgClass = isPositive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30';
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
    gold: 'from-amber-400 to-yellow-500',
    silver: 'from-slate-300 to-slate-400',
    platinum: 'from-slate-200 to-slate-300',
    palladium: 'from-slate-400 to-slate-500',
    copper: 'from-orange-400 to-orange-500',
    zinc: 'from-slate-400 to-slate-500',
    aluminum: 'from-slate-300 to-slate-400',
  };

  const metalGradient = metalGradients[metal.metalType.toLowerCase()] || 'from-emerald-400 to-emerald-500';

  return (
    <Link href={`/metals/${metal.metalType}`}>
      <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700/50 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col overflow-hidden">
        {/* Subtle gradient overlay on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isPositive ? 'bg-gradient-to-br from-emerald-500/5 to-transparent' : 'bg-gradient-to-br from-red-500/5 to-transparent'
        }`}></div>

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
                  <h3 className="text-xl md:text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors duration-300">
                    {metalName}
                  </h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 mt-1">
                    {metal.unit === 'per_gram' ? 'Per Gram' : 'Per Ounce'}
                  </p>
                </div>
              </div>
            </div>
            {metal.imageUrl && (
              <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-2xl overflow-hidden shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ml-4 flex-shrink-0 border border-slate-700">
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
              <span className="text-3xl md:text-4xl font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors duration-300">
                ₹{metal.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </span>
              <span className={`text-base md:text-lg font-bold px-4 py-2 rounded-xl border flex items-center gap-1 ${changeColorClass} ${changeBgClass} group-hover:bg-opacity-20 transition-all duration-300 transform group-hover:scale-105`}>
                {changeIcon}
                <span>{Math.abs(metal.changePercent || 0).toFixed(2)}%</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block px-3 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 border border-slate-600/50 group-hover:border-emerald-500/30 rounded-lg font-medium text-sm text-slate-300 transition-all duration-300">
                Currency: {metal.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
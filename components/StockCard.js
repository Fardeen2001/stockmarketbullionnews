import Link from 'next/link';
import Image from 'next/image';

export default function StockCard({ stock }) {
  const isPositive = stock.change >= 0;
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

  return (
    <Link href={`/stocks/${stock.symbol}`}>
      <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700/50 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col overflow-hidden">
        {/* Subtle gradient overlay on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isPositive ? 'bg-gradient-to-br from-emerald-500/5 to-transparent' : 'bg-gradient-to-br from-red-500/5 to-transparent'
        }`}></div>

        <div className="relative z-10 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors duration-300 truncate">
                {stock.name || stock.symbol}
              </h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                {stock.symbol} • {stock.exchange}
              </p>
            </div>
            {stock.imageUrl ? (
              <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-2xl overflow-hidden shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ml-4 flex-shrink-0 border border-slate-700">
                <Image
                  src={stock.imageUrl}
                  alt={stock.name || stock.symbol}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ml-4 flex-shrink-0 border border-slate-700">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors duration-300">
                ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </span>
              <span className={`text-base md:text-lg font-bold px-4 py-2 rounded-xl border flex items-center gap-1 ${changeColorClass} ${changeBgClass} group-hover:bg-opacity-20 transition-all duration-300 transform group-hover:scale-105`}>
                {changeIcon}
                <span>{Math.abs(stock.changePercent || 0).toFixed(2)}%</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stock.sector && (
                <span className="inline-block px-3 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 border border-slate-600/50 group-hover:border-emerald-500/30 rounded-lg font-medium text-sm text-slate-300 transition-all duration-300">
                  {stock.sector}
                </span>
              )}
              {stock.marketCap > 0 && (
                <span className="inline-block px-3 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 border border-slate-600/50 group-hover:border-emerald-500/30 rounded-lg font-medium text-sm text-slate-300 transition-all duration-300">
                  Mkt Cap: ₹{(stock.marketCap / 10000000).toFixed(2)} Cr
                </span>
              )}
            </div>
          </div>

          {stock.isShariaCompliant && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Sharia Compliant</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
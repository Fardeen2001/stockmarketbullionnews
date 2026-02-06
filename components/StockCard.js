import Link from 'next/link';
import Image from 'next/image';

export default function StockCard({ stock }) {
  const isPositive = stock.change >= 0;
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

  return (
    <Link href={`/stocks/${stock.symbol}`}>
      <div className="group glass rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 md:p-8 cursor-pointer hover-lift border border-white/30 relative overflow-hidden h-full flex flex-col">
        {/* Animated background gradient on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isPositive ? 'bg-gradient-success' : 'bg-gradient-warning'
        }`}></div>
        
        <div className="relative z-10 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-white transition-colors duration-300 truncate">
                {stock.name || stock.symbol}
              </h3>
              <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300">
                {stock.symbol} • {stock.exchange}
              </p>
            </div>
            {stock.imageUrl ? (
              <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-2xl overflow-hidden shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ml-4 flex-shrink-0">
                <Image
                  src={stock.imageUrl}
                  alt={stock.name || stock.symbol}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ml-4 flex-shrink-0">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-gray-900 group-hover:text-white transition-colors duration-300">
                ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </span>
              <span className={`text-base md:text-lg font-bold px-4 py-2 rounded-xl ${changeColor} ${changeBg} group-hover:bg-white/20 group-hover:text-white transition-all duration-300 transform group-hover:scale-105 flex items-center gap-1`}>
                {changeIcon}
                <span>{Math.abs(stock.changePercent || 0).toFixed(2)}%</span>
              </span>
            </div>
            <div className="text-sm text-gray-500 group-hover:text-white/70 transition-colors duration-300 flex flex-wrap gap-2">
              {stock.sector && (
                <span className="inline-block px-3 py-1.5 bg-gray-100 group-hover:bg-white/20 rounded-lg font-medium">
                  {stock.sector}
                </span>
              )}
              {stock.marketCap && stock.marketCap > 0 && (
                <span className="inline-block px-3 py-1.5 bg-gray-100 group-hover:bg-white/20 rounded-lg font-medium">
                  Mkt Cap: ₹{(stock.marketCap / 10000000).toFixed(2)} Cr
                </span>
              )}
            </div>
          </div>

          {stock.isShariaCompliant && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-success text-white text-xs font-bold rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sharia Compliant</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

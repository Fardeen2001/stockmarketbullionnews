import Link from 'next/link';
import Image from 'next/image';

export default function NewsCard({ article }) {
  const categoryColors = {
    stocks: 'bg-emerald-500',
    metals: 'bg-amber-500',
    sharia: 'bg-emerald-500',
    news: 'bg-slate-500',
  };

  const categoryColor = categoryColors[article.category?.toLowerCase()] || 'bg-emerald-500';

  return (
    <Link href={`/news/${article.slug}`}>
      <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 border border-slate-700/50 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 h-full flex flex-col">
        {article.imageUrl ? (
          <div className="relative w-full h-48 sm:h-56 overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover transform group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            <div className="absolute top-4 left-4 z-10">
              <span className={`px-3 py-1.5 ${categoryColor} text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm`}>
                {article.category || 'News'}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <div className="absolute top-4 left-4 z-10">
              <span className={`px-3 py-1.5 ${categoryColor} text-white text-xs font-bold rounded-full shadow-lg`}>
                {article.category || 'News'}
              </span>
            </div>
            <svg className="w-20 h-20 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center mb-3 flex-wrap gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {new Date(article.publishedAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-100 mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors duration-300 leading-tight">
            {article.title}
          </h3>
          <p className="text-sm md:text-base text-slate-400 line-clamp-3 group-hover:text-slate-300 transition-colors duration-300 leading-relaxed flex-grow">
            {article.summary}
          </p>
          <div className="mt-4 flex items-center text-emerald-400 font-semibold text-sm group-hover:translate-x-2 transition-all duration-300">
            <span>Read more</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
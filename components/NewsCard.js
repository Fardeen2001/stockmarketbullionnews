import Link from 'next/link';
import Image from 'next/image';

export default function NewsCard({ article }) {
  const categoryColors = {
    stocks: 'bg-accent',
    metals: 'bg-secondary',
    sharia: 'bg-accent',
    news: 'bg-secondary',
  };

  const categoryColor = categoryColors[article.category?.toLowerCase()] || 'bg-accent';

  return (
    <Link href={`/news/${article.slug}`}>
      <div className="group bg-secondary/80 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer hover-lift border border-secondary-300 relative h-full flex flex-col">
        {article.imageUrl ? (
          <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-primary to-primary-200">
            <Image
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover transform group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute top-4 left-4 z-10">
              <span className={`px-3 py-1.5 ${categoryColor} text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm`}>
                {article.category || 'News'}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-primary via-primary-200 to-secondary/30 flex items-center justify-center">
            <div className="absolute top-4 left-4 z-10">
              <span className={`px-3 py-1.5 ${categoryColor} text-white text-xs font-bold rounded-full shadow-lg`}>
                {article.category || 'News'}
              </span>
            </div>
            <svg className="w-24 h-24 text-secondary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        <div className="p-6 relative z-10 flex flex-col flex-grow">
          <div className="flex items-center mb-3 flex-wrap gap-2">
            <span className="text-xs text-accent/70 font-medium">
              {new Date(article.publishedAt).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-accent mb-3 line-clamp-2 group-hover:text-accent-300 transition-colors duration-300 leading-tight">
            {article.title}
          </h3>
          <p className="text-sm md:text-base text-accent/80 line-clamp-3 group-hover:text-accent transition-colors duration-300 leading-relaxed flex-grow">
            {article.summary}
          </p>
          <div className="mt-6 flex items-center text-accent font-semibold text-sm group-hover:text-accent-300 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
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

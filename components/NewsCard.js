import Link from 'next/link';
import Image from 'next/image';

export default function NewsCard({ article }) {
  return (
    <Link href={`/news/${article.slug}`}>
      <div className="group glass rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer hover-lift border border-white/20 relative">
        {article.imageUrl && (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
        <div className="p-6 relative z-10">
          <div className="flex items-center mb-3 flex-wrap gap-2">
            <span className="px-3 py-1 bg-gradient-primary text-white text-xs font-semibold rounded-full shadow-md">
              {article.category}
            </span>
            <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
              {new Date(article.publishedAt).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-gradient-primary transition-colors duration-300">
            {article.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
            {article.summary}
          </p>
          <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
            Read more →
          </div>
        </div>
      </div>
    </Link>
  );
}

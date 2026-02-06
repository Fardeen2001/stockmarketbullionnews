'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${selectedType}&limit=5`
        );
        const data = await response.json();
        
        if (data.success) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, selectedType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=${selectedType}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const totalResults = results?.counts?.total || 0;

  return (
    <div className="relative flex-1 max-w-2xl mx-4" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          {/* Search Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2.5 glass rounded-xl text-sm font-semibold text-gray-700 border-2 border-transparent hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 cursor-pointer shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="all">All</option>
            <option value="stocks">Stocks</option>
            <option value="metals">Metals</option>
            <option value="news">News</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (results && totalResults > 0) {
                  setIsOpen(true);
                }
              }}
              placeholder="Search stocks, metals, news..."
              className="w-full px-4 py-2.5 pl-11 glass rounded-xl text-gray-700 placeholder-gray-500 border-2 border-transparent hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
            />
            <svg
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {isLoading && (
              <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover-lift transition-all duration-300"
          >
            Search
          </button>
        </div>
      </form>

      {/* Dropdown Results */}
      {isOpen && results && totalResults > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto z-50 animate-fade-in backdrop-blur-xl"
        >
          {/* Stocks Results */}
          {results.results.stocks.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Stocks ({results.results.stocks.length})</h3>
              <div className="space-y-2">
                {results.results.stocks.map((stock) => (
                  <Link
                    key={stock._id}
                    href={stock.url}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-600">{stock.name}</div>
                      </div>
                      {stock.currentPrice && (
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">₹{stock.currentPrice.toLocaleString()}</div>
                          <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Metals Results */}
          {results.results.metals.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Metals ({results.results.metals.length})</h3>
              <div className="space-y-2">
                {results.results.metals.map((metal) => (
                  <Link
                    key={metal._id}
                    href={metal.url}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{metal.name || metal.metalType}</div>
                        <div className="text-sm text-gray-600">{metal.currency || 'INR'}</div>
                      </div>
                      {metal.currentPrice && (
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {metal.currency === 'USD' ? '$' : '₹'}{metal.currentPrice.toLocaleString()}
                          </div>
                          {metal.changePercent !== undefined && (
                            <div className={`text-sm ${metal.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {metal.changePercent >= 0 ? '+' : ''}{metal.changePercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* News Results */}
          {results.results.news.length > 0 && (
            <div className="p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">News ({results.results.news.length})</h3>
              <div className="space-y-2">
                {results.results.news.map((article) => (
                  <Link
                    key={article._id}
                    href={article.url}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 line-clamp-1">{article.title}</div>
                    {article.summary && (
                      <div className="text-sm text-gray-600 line-clamp-1 mt-1">{article.summary}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* View All Results Link */}
          {totalResults > 5 && (
            <div className="p-4 border-t border-white/20">
              <Link
                href={`/search?q=${encodeURIComponent(query)}&type=${selectedType}`}
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 px-4 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg shadow-indigo-500/50 transition-all duration-300"
              >
                View All {totalResults} Results →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {isOpen && results && totalResults === 0 && query.trim().length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl shadow-2xl border border-white/30 p-6 z-50 animate-fade-in backdrop-blur-xl"
        >
          <div className="text-center text-gray-600">
            <p className="font-semibold text-base">No results found</p>
            <p className="text-sm mt-1">Try different keywords or search type</p>
          </div>
        </div>
      )}
    </div>
  );
}

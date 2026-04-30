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
    }, 300);

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
            className="px-3 py-2.5 bg-slate-800 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="all" className="bg-slate-800">All</option>
            <option value="stocks" className="bg-slate-800">Stocks</option>
            <option value="metals" className="bg-slate-800">Metals</option>
            <option value="news" className="bg-slate-800">News</option>
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
              className="w-full px-4 py-2.5 pl-11 bg-slate-800 rounded-xl text-slate-100 placeholder-slate-500 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
            />
            <svg
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500"
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
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            Search
          </button>
        </div>
      </form>

      {/* Dropdown Results */}
      {isOpen && results && totalResults > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/50 border border-slate-700 max-h-96 overflow-y-auto z-50 animate-fade-in"
        >
          {/* Stocks Results */}
          {results.results.stocks.length > 0 && (
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-xs font-bold text-emerald-400 uppercase mb-2 tracking-wider">Stocks ({results.results.stocks.length})</h3>
              <div className="space-y-1">
                {results.results.stocks.map((stock) => (
                  <Link
                    key={stock._id}
                    href={stock.url}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-100">{stock.symbol}</div>
                        <div className="text-sm text-slate-400">{stock.name}</div>
                      </div>
                      {stock.currentPrice && (
                        <div className="text-right">
                          <div className="font-semibold text-slate-100">₹{stock.currentPrice.toLocaleString()}</div>
                          <div className={`text-sm ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-xs font-bold text-emerald-400 uppercase mb-2 tracking-wider">Metals ({results.results.metals.length})</h3>
              <div className="space-y-1">
                {results.results.metals.map((metal) => (
                  <Link
                    key={metal._id}
                    href={metal.url}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-100 capitalize">{metal.name || metal.metalType}</div>
                        <div className="text-sm text-slate-400">{metal.currency || 'INR'}</div>
                      </div>
                      {metal.currentPrice && (
                        <div className="text-right">
                          <div className="font-semibold text-slate-100">
                            {metal.currency === 'USD' ? '$' : '₹'}{metal.currentPrice.toLocaleString()}
                          </div>
                          {metal.changePercent !== undefined && (
                            <div className={`text-sm ${metal.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
              <h3 className="text-xs font-bold text-emerald-400 uppercase mb-2 tracking-wider">News ({results.results.news.length})</h3>
              <div className="space-y-1">
                {results.results.news.map((article) => (
                  <Link
                    key={article._id}
                    href={article.url}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-100 line-clamp-1">{article.title}</div>
                    {article.summary && (
                      <div className="text-sm text-slate-400 line-clamp-1 mt-1">{article.summary}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* View All Results Link */}
          {totalResults > 5 && (
            <div className="p-4 border-t border-slate-700">
              <Link
                href={`/search?q=${encodeURIComponent(query)}&type=${selectedType}`}
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/40 transition-all duration-300"
              >
                View All {totalResults} Results
              </Link>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {isOpen && results && totalResults === 0 && query.trim().length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/50 border border-slate-700 p-6 z-50 animate-fade-in"
        >
          <div className="text-center text-slate-400">
            <p className="font-semibold text-base">No results found</p>
            <p className="text-sm mt-1">Try different keywords or search type</p>
          </div>
        </div>
      )}
    </div>
  );
}
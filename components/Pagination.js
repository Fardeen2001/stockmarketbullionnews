'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Reusable Pagination Component with Items Per Page Selector
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  currentLimit = 12,
  limitOptions = [12, 24, 48, 96],
  basePath = '',
  additionalParams = {}
}) {
  const router = useRouter();
  const [selectedLimit, setSelectedLimit] = useState(currentLimit);

  useEffect(() => {
    setSelectedLimit(currentLimit);
  }, [currentLimit]);

  const buildUrl = (page, limit) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    return `${basePath}?${params.toString()}`;
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setSelectedLimit(newLimit);
    const newUrl = buildUrl(1, newLimit);
    router.push(newUrl);
  };

  if (totalPages <= 1 && totalItems <= currentLimit) {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Items per page:</span>
          <select
            value={selectedLimit}
            onChange={handleLimitChange}
            className="px-4 py-2.5 bg-slate-800 rounded-xl font-semibold text-slate-200 border border-slate-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 cursor-pointer"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option} className="bg-slate-800">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-400">
          Showing {totalItems} of {totalItems} items
        </div>
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2);
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, totalItems);

  return (
    <div className="flex flex-col gap-6 mt-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 font-medium">Items per page:</span>
          <select
            value={selectedLimit}
            onChange={handleLimitChange}
            className="px-4 py-2.5 bg-slate-800 rounded-xl font-semibold text-slate-200 border border-slate-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 cursor-pointer"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option} className="bg-slate-800">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-400">
          Showing <span className="font-semibold text-slate-200">{startItem}</span> to
          <span className="font-semibold text-slate-200"> {endItem}</span> of
          <span className="font-semibold text-slate-200"> {totalItems}</span> items
        </div>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-2">
        {currentPage > 1 ? (
          <a
            href={buildUrl(currentPage - 1, currentLimit)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 min-w-[100px] text-center"
          >
            Previous
          </a>
        ) : (
          <span className="px-4 py-2.5 bg-slate-800 rounded-xl font-semibold text-slate-500 cursor-not-allowed min-w-[100px] text-center border border-slate-700">
            Previous
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-4 py-2.5 bg-slate-800 rounded-xl font-semibold text-slate-400 border border-slate-700"
                >
                  ...
                </span>
              );
            }

            const isActive = pageNum === currentPage;
            return (
              <a
                key={pageNum}
                href={buildUrl(pageNum, currentLimit)}
                className={`px-4 py-2.5 rounded-xl font-semibold min-w-[44px] text-center transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-emerald-500'
                }`}
              >
                {pageNum}
              </a>
            );
          })}
        </div>

        {currentPage < totalPages ? (
          <a
            href={buildUrl(currentPage + 1, currentLimit)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 min-w-[100px] text-center"
          >
            Next
          </a>
        ) : (
          <span className="px-4 py-2.5 bg-slate-800 rounded-xl font-semibold text-slate-500 cursor-not-allowed min-w-[100px] text-center border border-slate-700">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
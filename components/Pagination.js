'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Reusable Pagination Component with Items Per Page Selector
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.currentLimit - Current items per page
 * @param {number[]} props.limitOptions - Available limit options (default: [12, 24, 48, 96])
 * @param {string} props.basePath - Base path for pagination links (e.g., '/stocks', '/news')
 * @param {Object} props.additionalParams - Additional query parameters to preserve (e.g., {category: 'stocks'})
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

  // Update selected limit when currentLimit prop changes
  useEffect(() => {
    setSelectedLimit(currentLimit);
  }, [currentLimit]);

  // Build URL with query parameters
  const buildUrl = (page, limit) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    // Add additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    return `${basePath}?${params.toString()}`;
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setSelectedLimit(newLimit);
    // Reset to page 1 when changing limit and navigate
    const newUrl = buildUrl(1, newLimit);
    router.push(newUrl);
  };

  // Don't render if only one page
  if (totalPages <= 1 && totalItems <= currentLimit) {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="text-sm text-accent">Items per page:</span>
          <select
            value={selectedLimit}
            onChange={handleLimitChange}
            className="px-4 py-2.5 bg-primary rounded-xl font-semibold text-accent border-2 border-transparent hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300 cursor-pointer shadow-sm"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-accent">
          Showing {totalItems} of {totalItems} items
        </div>
      </div>
    );
  }

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
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
      {/* Items per page selector and info */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-accent font-medium">Items per page:</span>
          <select
            value={selectedLimit}
            onChange={handleLimitChange}
            className="px-4 py-2.5 bg-primary rounded-xl font-semibold text-accent border-2 border-transparent hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300 cursor-pointer shadow-sm"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-accent">
          Showing <span className="font-semibold text-accent">{startItem}</span> to{' '}
          <span className="font-semibold text-accent">{endItem}</span> of{' '}
          <span className="font-semibold text-accent">{totalItems}</span> items
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {/* Previous button */}
        {currentPage > 1 ? (
          <a
            href={buildUrl(currentPage - 1, currentLimit)}
            className="px-4 py-2.5 bg-accent text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover-lift transition-all duration-300 min-w-[100px] text-center"
          >
            ← Previous
          </a>
        ) : (
          <span className="px-4 py-2.5 bg-primary rounded-xl font-semibold text-secondary cursor-not-allowed min-w-[100px] text-center border border-secondary-300">
            ← Previous
          </span>
        )}

        {/* Page numbers */}
        <div className="flex flex-wrap gap-2">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-4 py-2.5 bg-primary rounded-xl font-semibold text-accent border border-secondary-300"
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
                    ? 'bg-accent text-white shadow-lg scale-105'
                    : 'bg-primary text-accent hover:bg-accent hover:text-white hover-lift border border-secondary-300'
                }`}
              >
                {pageNum}
              </a>
            );
          })}
        </div>

        {/* Next button */}
        {currentPage < totalPages ? (
          <a
            href={buildUrl(currentPage + 1, currentLimit)}
            className="px-4 py-2.5 bg-accent text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover-lift transition-all duration-300 min-w-[100px] text-center"
          >
            Next →
          </a>
        ) : (
          <span className="px-4 py-2.5 bg-primary rounded-xl font-semibold text-secondary cursor-not-allowed min-w-[100px] text-center border border-secondary-300">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}

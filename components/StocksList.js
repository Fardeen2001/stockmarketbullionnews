'use client';

import { useState } from 'react';
import StockCard from '@/components/StockCard';
import RefreshPricesButton from '@/components/RefreshPricesButton';
import Pagination from '@/components/Pagination';

export default function StocksList({ initialStocks, initialPagination, currentPage, currentLimit }) {
  const [stocks, setStocks] = useState(initialStocks);
  const [pagination, setPagination] = useState(initialPagination);

  const handleRefresh = (updatedStocks) => {
    setStocks(updatedStocks);
  };

  return (
    <>
      {/* Refresh Button */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <RefreshPricesButton stocks={stocks} onRefresh={handleRefresh} />
        <div className="text-sm text-gray-500">
          Showing {stocks.length} of {pagination.total || 0} stocks
        </div>
      </div>

      {/* Stocks Grid */}
      {stocks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {stocks.map((stock, index) => (
              <div
                key={stock._id || stock.symbol}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <StockCard stock={stock} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total || 0}
              currentLimit={currentLimit}
              limitOptions={[12, 24, 48, 96]}
              basePath="/stocks"
            />
          )}
        </>
      ) : (
        <div className="text-center py-16 glass rounded-2xl animate-fade-in">
          <p className="text-gray-600 text-xl">No stocks available. Data is being updated.</p>
        </div>
      )}
    </>
  );
}

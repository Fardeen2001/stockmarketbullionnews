'use client';

import { useState } from 'react';

export default function RefreshPricesButton({ stocks, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
    if (isRefreshing || !stocks || stocks.length === 0) return;

    setIsRefreshing(true);
    setError(null);

    try {
      // Extract symbols from stocks array
      const symbols = stocks.map(stock => stock.symbol);

      const response = await fetch('/api/stocks/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to refresh prices');
      }

      // Update stocks with new data
      if (data.data && data.data.length > 0) {
        const updatedStocks = stocks.map(stock => {
          const updated = data.data.find(s => s.symbol === stock.symbol);
          return updated ? { ...stock, ...updated } : stock;
        });
        
        // Call parent callback to update state
        if (onRefresh) {
          onRefresh(updatedStocks);
        }
      }

      setLastRefreshed(new Date());
      
      // Show success message or partial success warning
      if (data.errors && data.errors.length > 0) {
        setError(`Refreshed ${data.data?.length || 0} stocks. ${data.errors.length} failed.`);
      } else if (data.data && data.data.length > 0) {
        // Clear any previous errors on full success
        setError(null);
      }
    } catch (err) {
      console.error('Error refreshing prices:', err);
      setError(err.message || 'Failed to refresh prices. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || !stocks || stocks.length === 0}
        className={`
          inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
          transition-all duration-300 shadow-lg hover:shadow-xl
          ${isRefreshing || !stocks || stocks.length === 0
            ? 'bg-secondary cursor-not-allowed text-white'
            : 'bg-accent text-white hover:scale-105 active:scale-95'
          }
        `}
      >
        {isRefreshing ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Refreshing Prices...</span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh Prices</span>
          </>
        )}
      </button>

      {lastRefreshed && !error && (
        <p className="mt-2 text-sm text-green-600">
          ✓ Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          ⚠ {error}
        </p>
      )}

      {!isRefreshing && stocks && stocks.length > 0 && (
        <p className="mt-2 text-sm text-accent/70">
          Click to fetch live prices for {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

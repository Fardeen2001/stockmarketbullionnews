'use client';

import { useMemo } from 'react';

export default function StockAnalysis({ stock }) {
  const analysis = useMemo(() => {
    if (!stock) return null;

    // Calculate additional metrics
    const priceFrom52WLow = stock.high52Week && stock.low52Week && stock.currentPrice
      ? ((stock.currentPrice - stock.low52Week) / (stock.high52Week - stock.low52Week)) * 100
      : null;

    const priceFrom52WHigh = stock.high52Week && stock.currentPrice
      ? ((stock.currentPrice / stock.high52Week) * 100)
      : null;

    const priceFrom52WLowPercent = stock.low52Week && stock.currentPrice
      ? ((stock.currentPrice - stock.low52Week) / stock.low52Week) * 100
      : null;

    // Calculate price statistics from history
    const priceHistory = stock.priceHistory || [];
    const prices = priceHistory.map(p => p.close || p.price).filter(p => p > 0);
    
    const avgPrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;

    const volatility = prices.length > 1
      ? calculateVolatility(prices)
      : null;

    // Calculate volume statistics
    const volumes = priceHistory.map(p => p.volume || 0).filter(v => v > 0);
    const avgVolume = volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : null;

    const volumeRatio = stock.volume && avgVolume
      ? (stock.volume / avgVolume).toFixed(2)
      : null;

    // Risk assessment
    const riskLevel = calculateRiskLevel(stock, volatility);

    // Performance metrics
    const performance = calculatePerformance(stock, priceHistory);

    return {
      priceFrom52WLow,
      priceFrom52WHigh,
      priceFrom52WLowPercent,
      avgPrice,
      volatility,
      avgVolume,
      volumeRatio,
      riskLevel,
      performance,
    };
  }, [stock]);

  if (!analysis || !stock) return null;

  return (
    <div className="space-y-6">
      {/* Performance Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">52W Range Position</p>
            <p className="text-lg font-semibold">
              {analysis.priceFrom52WLow !== null 
                ? `${analysis.priceFrom52WLow.toFixed(1)}%` 
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-400">
              {analysis.priceFrom52WLow !== null && analysis.priceFrom52WLow > 50 
                ? 'Above midpoint' 
                : 'Below midpoint'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">From 52W High</p>
            <p className={`text-lg font-semibold ${
              analysis.priceFrom52WHigh !== null && analysis.priceFrom52WHigh < 90 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {analysis.priceFrom52WHigh !== null 
                ? `${(100 - analysis.priceFrom52WHigh).toFixed(1)}%` 
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">From 52W Low</p>
            <p className={`text-lg font-semibold ${
              analysis.priceFrom52WLowPercent !== null && analysis.priceFrom52WLowPercent > 20 
                ? 'text-green-600' 
                : 'text-gray-900'
            }`}>
              {analysis.priceFrom52WLowPercent !== null 
                ? `+${analysis.priceFrom52WLowPercent.toFixed(1)}%` 
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Price</p>
            <p className="text-lg font-semibold">
              {analysis.avgPrice 
                ? `₹${analysis.avgPrice.toFixed(2)}` 
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Trading Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Trading Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Volume</p>
            <p className="text-lg font-semibold">
              {stock.volume 
                ? stock.volume.toLocaleString('en-IN') 
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Volume</p>
            <p className="text-lg font-semibold">
              {analysis.avgVolume 
                ? analysis.avgVolume.toLocaleString('en-IN') 
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Volume Ratio</p>
            <p className={`text-lg font-semibold ${
              analysis.volumeRatio && parseFloat(analysis.volumeRatio) > 1.5 
                ? 'text-green-600' 
                : analysis.volumeRatio && parseFloat(analysis.volumeRatio) < 0.5 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {analysis.volumeRatio 
                ? `${analysis.volumeRatio}x` 
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-400">
              {analysis.volumeRatio && parseFloat(analysis.volumeRatio) > 1.5 
                ? 'High activity' 
                : analysis.volumeRatio && parseFloat(analysis.volumeRatio) < 0.5 
                ? 'Low activity' 
                : 'Normal'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Volatility</p>
            <p className={`text-lg font-semibold ${
              analysis.volatility && analysis.volatility > 0.05 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {analysis.volatility 
                ? `${(analysis.volatility * 100).toFixed(2)}%` 
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-400">
              {analysis.volatility && analysis.volatility > 0.05 
                ? 'High volatility' 
                : 'Moderate'}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Fundamentals */}
      {stock.fundamentals && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Fundamentals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stock.fundamentals.revenue > 0 && (
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-lg font-semibold">
                  ₹{(stock.fundamentals.revenue / 10000000).toFixed(2)} Cr
                </p>
              </div>
            )}
            {stock.fundamentals.profit !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Profit</p>
                <p className={`text-lg font-semibold ${
                  stock.fundamentals.profit >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ₹{(stock.fundamentals.profit / 10000000).toFixed(2)} Cr
                </p>
              </div>
            )}
            {stock.fundamentals.debt !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Debt</p>
                <p className="text-lg font-semibold">
                  ₹{(stock.fundamentals.debt / 10000000).toFixed(2)} Cr
                </p>
              </div>
            )}
            {stock.fundamentals.equity > 0 && (
              <div>
                <p className="text-sm text-gray-500">Equity</p>
                <p className="text-lg font-semibold">
                  ₹{(stock.fundamentals.equity / 10000000).toFixed(2)} Cr
                </p>
              </div>
            )}
            {stock.fundamentals.debt > 0 && stock.fundamentals.equity > 0 && (
              <div>
                <p className="text-sm text-gray-500">Debt/Equity</p>
                <p className={`text-lg font-semibold ${
                  (stock.fundamentals.debt / stock.fundamentals.equity) > 1 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {(stock.fundamentals.debt / stock.fundamentals.equity).toFixed(2)}
                </p>
              </div>
            )}
            {stock.fundamentals.revenue > 0 && stock.fundamentals.profit > 0 && (
              <div>
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-lg font-semibold">
                  {((stock.fundamentals.profit / stock.fundamentals.revenue) * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Overall Risk Level</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                analysis.riskLevel === 'Low' 
                  ? 'bg-green-100 text-green-800' 
                  : analysis.riskLevel === 'Medium' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {analysis.riskLevel}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  analysis.riskLevel === 'Low' 
                    ? 'bg-green-500' 
                    : analysis.riskLevel === 'Medium' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ 
                  width: analysis.riskLevel === 'Low' 
                    ? '33%' 
                    : analysis.riskLevel === 'Medium' 
                    ? '66%' 
                    : '100%' 
                }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Price Stability</p>
              <p className={`font-semibold ${
                analysis.volatility && analysis.volatility < 0.03 
                  ? 'text-green-600' 
                  : analysis.volatility && analysis.volatility < 0.05 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}>
                {analysis.volatility && analysis.volatility < 0.03 
                  ? 'Stable' 
                  : analysis.volatility && analysis.volatility < 0.05 
                  ? 'Moderate' 
                  : 'Volatile'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Market Position</p>
              <p className={`font-semibold ${
                analysis.priceFrom52WLow !== null && analysis.priceFrom52WLow > 70 
                  ? 'text-green-600' 
                  : analysis.priceFrom52WLow !== null && analysis.priceFrom52WLow > 30 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}>
                {analysis.priceFrom52WLow !== null && analysis.priceFrom52WLow > 70 
                  ? 'Strong' 
                  : analysis.priceFrom52WLow !== null && analysis.priceFrom52WLow > 30 
                  ? 'Moderate' 
                  : 'Weak'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Liquidity</p>
              <p className={`font-semibold ${
                analysis.volumeRatio && parseFloat(analysis.volumeRatio) > 1 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`}>
                {analysis.volumeRatio && parseFloat(analysis.volumeRatio) > 1 
                  ? 'High' 
                  : 'Moderate'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Valuation Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">P/E Ratio</p>
            <p className={`text-lg font-semibold ${
              stock.peRatio && stock.peRatio > 0 && stock.peRatio < 25 
                ? 'text-green-600' 
                : stock.peRatio && stock.peRatio > 0 
                ? 'text-yellow-600' 
                : 'text-gray-900'
            }`}>
              {stock.peRatio || 'N/A'}
            </p>
            <p className="text-xs text-gray-400">
              {stock.peRatio && stock.peRatio > 0 && stock.peRatio < 15 
                ? 'Undervalued' 
                : stock.peRatio && stock.peRatio < 25 
                ? 'Fair value' 
                : stock.peRatio && stock.peRatio > 0 
                ? 'Overvalued' 
                : ''}
            </p>
          </div>
          {stock.marketCap > 0 && stock.fundamentals?.revenue > 0 && (
            <div>
              <p className="text-sm text-gray-500">Price/Sales</p>
              <p className="text-lg font-semibold">
                {(stock.marketCap / stock.fundamentals.revenue).toFixed(2)}
              </p>
            </div>
          )}
          {stock.marketCap > 0 && stock.fundamentals?.equity > 0 && (
            <div>
              <p className="text-sm text-gray-500">Price/Book</p>
              <p className="text-lg font-semibold">
                {(stock.marketCap / stock.fundamentals.equity).toFixed(2)}
              </p>
            </div>
          )}
          {stock.currentPrice > 0 && stock.fundamentals?.profit > 0 && (
            <div>
              <p className="text-sm text-gray-500">Earnings Yield</p>
              <p className="text-lg font-semibold">
                {((stock.fundamentals.profit / stock.marketCap) * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateVolatility(prices) {
  if (prices.length < 2) return null;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function calculateRiskLevel(stock, volatility) {
  let riskScore = 0;
  
  // Volatility risk
  if (volatility && volatility > 0.05) riskScore += 2;
  else if (volatility && volatility > 0.03) riskScore += 1;
  
  // Price position risk
  if (stock.high52Week && stock.low52Week && stock.currentPrice) {
    const position = ((stock.currentPrice - stock.low52Week) / (stock.high52Week - stock.low52Week)) * 100;
    if (position < 20) riskScore += 2;
    else if (position > 80) riskScore += 1;
  }
  
  // Debt risk
  if (stock.fundamentals?.debt && stock.fundamentals?.equity) {
    const debtEquity = stock.fundamentals.debt / stock.fundamentals.equity;
    if (debtEquity > 1) riskScore += 2;
    else if (debtEquity > 0.5) riskScore += 1;
  }
  
  if (riskScore <= 2) return 'Low';
  if (riskScore <= 4) return 'Medium';
  return 'High';
}

function calculatePerformance(stock, priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return null;
  
  const sortedHistory = [...priceHistory].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0);
    const dateB = new Date(b.date || b.timestamp || 0);
    return dateA - dateB;
  });
  
  const firstPrice = sortedHistory[0].close || sortedHistory[0].price;
  const lastPrice = stock.currentPrice;
  
  if (!firstPrice || !lastPrice) return null;
  
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  return {
    totalReturn,
    firstPrice,
    lastPrice,
  };
}

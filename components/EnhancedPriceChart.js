'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedPriceChart({ data, showVolume = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0);
    const dateB = new Date(b.date || b.timestamp || 0);
    return dateA - dateB;
  });

  // Calculate moving averages
  const calculateMA = (period) => {
    const ma = [];
    for (let i = 0; i < sortedData.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        const sum = sortedData.slice(i - period + 1, i + 1)
          .reduce((acc, item) => acc + (item.close || item.price || 0), 0);
        ma.push(sum / period);
      }
    }
    return ma;
  };

  const ma20 = calculateMA(20);
  const ma50 = calculateMA(50);

  // Prepare chart data
  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.date || item.timestamp);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Price',
        data: sortedData.map(item => item.close || item.price || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      ...(ma20.filter(v => v !== null).length > 0 ? [{
        label: 'MA 20',
        data: ma20,
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
        pointRadius: 0,
        yAxisID: 'y',
      }] : []),
      ...(ma50.filter(v => v !== null).length > 0 ? [{
        label: 'MA 50',
        data: ma50,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
        pointRadius: 0,
        yAxisID: 'y',
      }] : []),
      ...(showVolume && sortedData[0].volume ? [{
        label: 'Volume (scaled)',
        data: sortedData.map(item => {
          // Scale volume to fit price range for visualization
          const maxVolume = Math.max(...sortedData.map(d => d.volume || 0));
          const maxPrice = Math.max(...sortedData.map(d => d.close || d.price || 0));
          const minPrice = Math.min(...sortedData.map(d => d.close || d.price || 0));
          const priceRange = maxPrice - minPrice;
          if (maxVolume > 0 && priceRange > 0) {
            return minPrice + ((item.volume || 0) / maxVolume) * priceRange * 0.3; // Scale to 30% of price range
          }
          return 0;
        }),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        yAxisID: 'y',
      }] : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Price: ₹${context.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            }
            if (context.datasetIndex === 1 || context.datasetIndex === 2) {
              return `MA: ₹${context.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            }
            if (context.datasetIndex === 3) {
              const originalVolume = sortedData[context.dataIndex]?.volume || 0;
              return `Volume: ${originalVolume.toLocaleString('en-IN')}`;
            }
            return context.dataset.label + ': ' + context.parsed.y;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return (
    <div className="h-96">
      <Line data={chartData} options={options} />
    </div>
  );
}

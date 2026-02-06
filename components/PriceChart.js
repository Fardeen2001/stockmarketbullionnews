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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PriceChart({ data }) {
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
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          },
        },
      },
    },
  };

  return (
    <div className="h-64 md:h-80 lg:h-96">
      <Line data={chartData} options={options} />
    </div>
  );
}

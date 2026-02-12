export default function AdminStats({ stats }) {
  const statCards = [
    {
      title: 'Total Stocks',
      value: stats.totalStocks,
      icon: '📈',
      color: 'blue',
    },
    {
      title: 'Total Metals',
      value: stats.totalMetals,
      icon: '🥇',
      color: 'yellow',
    },
    {
      title: 'Total News',
      value: stats.totalNews,
      icon: '📰',
      color: 'green',
    },
    {
      title: 'Published News',
      value: stats.publishedNews,
      icon: '✅',
      color: 'green',
    },
    {
      title: 'Scraped Items',
      value: stats.totalScraped,
      icon: '🔍',
      color: 'purple',
    },
    {
      title: 'Pending Processing',
      value: stats.unprocessedScraped,
      icon: '⏳',
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: 'bg-accent',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-secondary',
    orange: 'bg-orange-500',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-accent/80">{stat.title}</p>
              <p className="text-3xl font-bold text-accent mt-2">{stat.value.toLocaleString()}</p>
            </div>
            <div className={`${colorClasses[stat.color]} p-3 rounded-lg`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

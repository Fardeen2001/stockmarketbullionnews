import Link from 'next/link';

export default function AdminRecentActivity({ title, items }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-secondary-300">
        <h2 className="text-lg font-semibold text-accent">{title}</h2>
      </div>
      <div className="divide-y divide-secondary-300">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="p-4 hover:bg-primary">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.link ? (
                    <Link
                      href={item.link}
                      className="text-sm font-medium text-accent hover:text-accent-300"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-accent">{item.title}</p>
                  )}
                  <div className="mt-1 flex items-center space-x-4 text-xs text-accent/70">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    {item.source && <span>Source: {item.source}</span>}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.status === 'Published' || item.status === 'Processed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-accent/70 text-sm">
            No items found
          </div>
        )}
      </div>
    </div>
  );
}

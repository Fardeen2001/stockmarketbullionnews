import Link from 'next/link';

export default function AdminRecentActivity({ title, items }) {
  return (
    <div className="bg-[#1e293b] rounded-lg shadow-lg border border-[#334155]">
      <div className="p-6 border-b border-[#334155]">
        <h2 className="text-lg font-semibold text-emerald-400">{title}</h2>
      </div>
      <div className="divide-y divide-[#334155]">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="p-4 hover:bg-[#0f172a] transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.link ? (
                    <Link
                      href={item.link}
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-emerald-400">{item.title}</p>
                  )}
                  <div className="mt-1 flex items-center space-x-4 text-xs text-slate-400">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    {item.source && <span>Source: {item.source}</span>}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.status === 'Published' || item.status === 'Processed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-slate-400 text-sm">
            No items found
          </div>
        )}
      </div>
    </div>
  );
}

import Link from 'next/link';

function idStr(stock) {
  return typeof stock._id === 'string' ? stock._id : String(stock._id);
}

export default function AdminStocksTable({ stocks, currentPage, totalPages }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-800 to-slate-900 shadow-card-lg">
      <table className="min-w-full divide-y divide-slate-600/80">
        <thead className="bg-slate-900/70">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Symbol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Exchange
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Change %
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Sharia
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Last Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-600/60">
          {stocks.map((stock) => (
            <tr key={idStr(stock)} className="hover:bg-slate-900/40">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  {stock.symbol}
                </Link>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">{stock.name}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{stock.exchange}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </td>
              <td
                className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${
                  stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {stock.changePercent >= 0 ? '+' : ''}
                {stock.changePercent?.toFixed(2) || '0.00'}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {stock.isShariaCompliant ? (
                  <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40">
                    Yes
                  </span>
                ) : (
                  <span className="rounded bg-slate-900/80 px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-600/60">
                    No
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleDateString() : '—'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link href={`/stocks/${stock.symbol}`} className="text-emerald-400 hover:text-emerald-300">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-600/80 bg-slate-900/50 px-6 py-4">
          <div className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/stocks?page=${currentPage - 1}`}
                className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/stocks?page=${currentPage + 1}`}
                className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

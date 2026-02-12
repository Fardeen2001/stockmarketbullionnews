import Link from 'next/link';

export default function AdminStocksTable({ stocks, currentPage, totalPages }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-secondary-300">
        <thead className="bg-primary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Symbol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Exchange
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Change %
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Sharia
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-accent/70 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-300">
          {stocks.map((stock) => (
            <tr key={stock._id.toString()}>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="text-sm font-medium text-accent hover:text-accent-300"
                >
                  {stock.symbol}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                {stock.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                {stock.exchange}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2) || '0.00'}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {stock.isShariaCompliant ? (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    Yes
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-accent">
                    No
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                {new Date(stock.lastUpdated).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="text-accent hover:text-accent-300"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="bg-primary px-6 py-4 flex items-center justify-between border-t border-secondary-300">
          <div className="text-sm text-accent/80">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/stocks?page=${currentPage - 1}`}
                className="px-4 py-2 text-sm font-medium text-accent/80 bg-white border border-secondary-300 rounded-md hover:bg-primary"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/stocks?page=${currentPage + 1}`}
                className="px-4 py-2 text-sm font-medium text-accent/80 bg-white border border-secondary-300 rounded-md hover:bg-primary"
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

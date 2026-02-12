export default function AdminScrapedTable({ scraped, currentPage, totalPages }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-secondary-300">
        <thead className="bg-primary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Scraped At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-300">
          {scraped.map((item) => (
            <tr key={item._id.toString()}>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-accent max-w-md truncate">
                  {item.title}
                </div>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:text-accent-300"
                  >
                    View Source
                  </a>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                {item.source || item.sourceType || 'Unknown'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-accent">
                  {item.category || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.isProcessed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {item.isProcessed ? 'Processed' : 'Pending'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                {new Date(item.scrapedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-300"
                  >
                    View
                  </a>
                )}
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
              <a
                href={`/admin/scraped?page=${currentPage - 1}`}
                className="px-4 py-2 text-sm font-medium text-accent/80 bg-white border border-secondary-300 rounded-md hover:bg-primary"
              >
                Previous
              </a>
            )}
            {currentPage < totalPages && (
              <a
                href={`/admin/scraped?page=${currentPage + 1}`}
                className="px-4 py-2 text-sm font-medium text-accent/80 bg-white border border-secondary-300 rounded-md hover:bg-primary"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

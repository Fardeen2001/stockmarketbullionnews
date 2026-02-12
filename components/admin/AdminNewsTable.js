'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AdminNewsTable({ news, currentPage, totalPages }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id, slug) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete article');
      }
    } catch (error) {
      alert('Error deleting article');
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      alert('Error updating article');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-secondary-300">
        <thead className="bg-primary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Published
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase tracking-wider">
              Views
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-accent/70 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-300">
          {news.map((article) => (
            <tr key={article._id.toString()}>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/news/${article.slug}`}
                  className="text-sm font-medium text-accent hover:text-accent-300"
                >
                  {article.title}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-accent">
                  {article.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    article.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-primary text-accent'
                  }`}
                >
                  {article.isPublished ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                {new Date(article.publishedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                {article.viewCount || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleTogglePublish(article._id.toString(), article.isPublished)}
                  className="text-accent hover:text-accent-300 mr-4"
                >
                  {article.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(article._id.toString(), article.slug)}
                  disabled={deleting === article._id.toString()}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deleting === article._id.toString() ? 'Deleting...' : 'Delete'}
                </button>
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
                href={`/admin/news?page=${currentPage - 1}`}
                className="px-4 py-2 text-sm font-medium text-accent/80 bg-white border border-secondary-300 rounded-md hover:bg-primary"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/news?page=${currentPage + 1}`}
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

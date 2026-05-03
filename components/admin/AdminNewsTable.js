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

  const idStr = (article) => (typeof article._id === 'string' ? article._id : String(article._id));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-800 to-slate-900 shadow-card-lg">
      <table className="min-w-full divide-y divide-slate-600/80">
        <thead className="bg-slate-900/70">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Published
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              Views
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-600/60">
          {news.map((article) => (
            <tr key={idStr(article)} className="hover:bg-slate-900/40">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/news/${article.slug}`}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  {article.title}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="rounded bg-slate-900/80 px-2 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-600/60">
                  {article.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    article.isPublished
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/80 text-slate-300 ring-1 ring-slate-600/60'
                  }`}
                >
                  {article.isPublished ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '—'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                {article.viewCount || 0}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(idStr(article), article.isPublished)}
                  className="mr-4 text-emerald-400 hover:text-emerald-300"
                >
                  {article.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idStr(article), article.slug)}
                  disabled={deleting === idStr(article)}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {deleting === idStr(article) ? 'Deleting...' : 'Delete'}
                </button>
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
                href={`/admin/news?page=${currentPage - 1}`}
                className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/news?page=${currentPage + 1}`}
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

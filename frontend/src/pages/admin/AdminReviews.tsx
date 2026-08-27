import React, { useState } from 'react';
import { FiStar, FiTrash2, FiSearch, FiCheck, FiX } from 'react-icons/fi';

const reviews = [
  { id: 1, user: 'Alice Johnson', product: 'MacBook Air M3', rating: 5, comment: 'Absolutely incredible machine! The M3 chip is blazing fast and the battery lasts all day.', date: 'Jul 24, 2026', status: 'Approved', verified: true },
  { id: 2, user: 'Bob Smith', product: 'Sony WH-1000XM5', rating: 4, comment: 'Great noise cancellation. Comfortable for long sessions. Sound quality is top-notch.', date: 'Jul 24, 2026', status: 'Pending', verified: true },
  { id: 3, user: 'Carol White', product: 'Nike Air Max 270', rating: 5, comment: 'Very comfortable and stylish. Great for casual wear and light jogging.', date: 'Jul 23, 2026', status: 'Approved', verified: false },
  { id: 4, user: 'David Brown', product: 'Samsung Galaxy S24', rating: 2, comment: 'Battery life is disappointing. Expected more from a flagship device.', date: 'Jul 23, 2026', status: 'Pending', verified: true },
  { id: 5, user: 'Eva Martinez', product: 'Apple AirPods Pro', rating: 5, comment: 'Best earbuds I have ever used. ANC is amazing and fit is perfect.', date: 'Jul 22, 2026', status: 'Approved', verified: true },
  { id: 6, user: 'Frank Lee', product: 'Adidas Ultraboost 22', rating: 3, comment: 'Good shoe but sizing runs small. Consider ordering a half size up.', date: 'Jul 21, 2026', status: 'Rejected', verified: false },
  { id: 7, user: 'Grace Kim', product: 'iPad Pro 12.9"', rating: 5, comment: 'Perfect for digital art and note-taking. The display is stunning.', date: 'Jul 21, 2026', status: 'Approved', verified: true },
];

const statusColors: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

const ratingColor = (r: number) => {
  if (r >= 4) return 'text-emerald-600 dark:text-emerald-400';
  if (r === 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const AdminReviews: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = reviews.filter(r =>
    (statusFilter === 'All' || r.status === statusFilter) &&
    (r.product.toLowerCase().includes(search.toLowerCase()) || r.user.toLowerCase().includes(search.toLowerCase()))
  );

  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reviews</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reviews.length} total reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Rating', value: `⭐ ${avgRating}`, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved', value: reviews.filter(r => r.status === 'Approved').length, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending', value: reviews.filter(r => r.status === 'Pending').length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Rejected', value: reviews.filter(r => r.status === 'Rejected').length, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rating Distribution */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const pct = (count / reviews.length) * 100;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-8 flex items-center gap-1">
                  {star} <FiStar className="h-3 w-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
              statusFilter === s
                ? 'bg-violet-600 text-white border-violet-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reviews Cards */}
      <div className="space-y-4">
        {filtered.map(review => (
          <div key={review.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {review.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{review.user}</span>
                    {review.verified && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[review.status]}`}>{review.status}</span>
                  </div>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 font-medium">{review.product}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                    <span className={`text-xs font-bold ml-1 ${ratingColor(review.rating)}`}>{review.rating}/5</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">{review.date}</span>
                {review.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => alert('Review approved! (Demo)')}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                      title="Approve"
                    >
                      <FiCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alert('Review rejected! (Demo)')}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Reject"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-13 ml-[52px]">
              "{review.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReviews;

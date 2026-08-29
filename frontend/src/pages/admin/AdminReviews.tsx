import React, { useState, useEffect } from 'react';
import { FiStar, FiTrash2, FiSearch, FiCheck, FiX, FiEdit2 } from 'react-icons/fi';
import { api } from '../../services/api';
import { notifySuccess, notifyError } from '../../components/Toast';

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

const ratingColor = (r: number) => {
  if (r >= 4) return 'text-emerald-600 dark:text-emerald-400';
  if (r === 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reviews/all?limit=100');
      setReviews(res.data?.data?.reviews || []);
    } catch (err) {
      notifyError('Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/reviews/${id}/status`, { status });
      notifySuccess(`Review ${status}`);
      fetchReviews();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      notifySuccess('Review deleted');
      fetchReviews();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/reviews/${editingReview._id}`, {
        rating: editingReview.rating,
        comment: editingReview.comment,
      });
      if (editingReview.status !== editingReview.originalStatus) {
        await api.put(`/reviews/${editingReview._id}/status`, { status: editingReview.status });
      }
      notifySuccess('Review updated');
      setEditingReview(null);
      fetchReviews();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to update');
    }
  };

  const filtered = reviews.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    if (!search.trim()) return matchesStatus;
    const searchLower = search.toLowerCase();
    const prodTitle = typeof r.product === 'object' && r.product !== null ? (r.product.title || '') : String(r.product || '');
    const userName = typeof r.user === 'object' && r.user !== null ? (r.user.name || '') : String(r.user || '');
    const commentText = r.comment || '';
    return (
      matchesStatus &&
      (prodTitle.toLowerCase().includes(searchLower) ||
       userName.toLowerCase().includes(searchLower) ||
       commentText.toLowerCase().includes(searchLower))
    );
  });

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reviews</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reviews.length} total reviews</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Rating', value: `⭐ ${avgRating}`, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved', value: reviews.filter(r => r.status === 'approved').length, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending', value: reviews.filter(r => r.status === 'pending').length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Rejected', value: reviews.filter(r => r.status === 'rejected').length, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

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
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-violet-600 text-white border-violet-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
           <p className="text-sm text-gray-500 text-center py-10">Loading reviews...</p>
        ) : filtered.length === 0 ? (
           <p className="text-sm text-gray-500 text-center py-10">No reviews found.</p>
        ) : filtered.map(review => {
          const userName = review.user?.name || 'Unknown User';
          const productTitle = review.product?.title || 'Unknown Product';
          const date = new Date(review.createdAt).toLocaleDateString();

          return (
          <div key={review._id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{userName}</span>
                    {review.verifiedPurchase && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${statusColors[review.status] || ''}`}>
                      {review.status === 'rejected' ? 'Rejected by Admin' : review.status}
                    </span>
                  </div>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 font-medium">
                    {productTitle}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                    <span className={`text-xs font-bold ml-1 ${ratingColor(review.rating)}`}>{review.rating}/5</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
                {review.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusChange(review._id, 'approved')}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    title="Approve Review"
                  >
                    <FiCheck className="h-4 w-4" />
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusChange(review._id, 'rejected')}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Reject Review"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
                <button 
                  onClick={() => setEditingReview({ ...review, originalStatus: review.status })}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors" title="Edit">
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(review._id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-13 ml-[52px]">
              "{review.comment}"
            </p>
          </div>
        )})}
      </div>

      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Review</h3>
              <button onClick={() => setEditingReview(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                <input
                  type="number"
                  min="1" max="5"
                  required
                  value={editingReview.rating}
                  onChange={e => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Comment</label>
                <textarea
                  required
                  rows={4}
                  value={editingReview.comment}
                  onChange={e => setEditingReview({ ...editingReview, comment: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={editingReview.status}
                  onChange={e => setEditingReview({ ...editingReview, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;

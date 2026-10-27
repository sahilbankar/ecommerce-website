import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { notifySuccess, notifyError } from '../../components/Toast';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiTag, FiPercent, FiDownload } from 'react-icons/fi';
import { exportCouponsPdf } from '../../utils/pdfExport';



const statusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Expired: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
};

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/coupons');
      setCoupons(res.data?.data?.coupons || []);
    } catch (err) {
      notifyError('Failed to fetch coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', type: 'Percentage', value: '', minOrder: '', limit: '', expires: '' });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code,
        discountType: form.type.toLowerCase(),
        discountAmount: Number(form.value) || 0,
        minPurchase: Number(form.minOrder) || 0,
        usageLimit: Number(form.limit) || null,
        expiresAt: form.expires ? new Date(form.expires).toISOString() : undefined,
        isActive: true
      };
      if (editingId) {
        await api.put(`/coupons/${editingId}`, payload);
        notifySuccess('Coupon updated successfully');
      } else {
        await api.post('/coupons', payload);
        notifySuccess('Coupon created successfully');
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ code: '', type: 'Percentage', value: '', minOrder: '', limit: '', expires: '' });
      fetchCoupons();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      notifySuccess('Coupon deleted successfully');
      fetchCoupons();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleDownloadPdf = () => {
    if (coupons.length === 0) {
      notifyError('No coupons available to export');
      return;
    }
    exportCouponsPdf(coupons);
    notifySuccess('Coupons report downloaded successfully!');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Coupons</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{coupons.length} coupon codes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FiDownload className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Download PDF Report
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ code: '', type: 'Percentage', value: '', minOrder: '', limit: '', expires: '' }); setShowModal(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <FiPlus className="h-4 w-4" /> Create Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', value: coupons.length, color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Active', value: coupons.filter(c => c.isActive && new Date(c.expiresAt) >= new Date()).length, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Expired', value: coupons.filter(c => !c.isActive || new Date(c.expiresAt) < new Date()).length, color: 'text-red-600 dark:text-red-400' },
          { label: 'Total Uses', value: coupons.reduce((a, c) => a + (c.usageCount || 0), 0), color: 'text-blue-600 dark:text-blue-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Coupon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div key={coupon._id} className={`group relative rounded-2xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all overflow-hidden ${(!coupon.isActive || new Date(coupon.expiresAt) < new Date()) ? 'border-gray-200 dark:border-gray-800 opacity-70' : 'border-violet-200 dark:border-violet-900/40'}`}>
            {/* Dashed divider */}
            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-gray-700 z-0" />
            <div className="absolute left-[calc(35%-12px)] top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 z-10" />
            <div className="absolute right-[calc(35%-12px)] top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 z-10" />

            {/* Top Section */}
            <div className="relative z-20 p-4 pb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'bg-violet-100 dark:bg-violet-950/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {coupon.discountType === 'percentage' ? (
                      <FiPercent className={`h-4 w-4 ${(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500'}`} />
                    ) : (
                      <FiTag className={`h-4 w-4 ${(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed'}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'Active' : 'Expired']}`}>{(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'Active' : 'Expired'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono tracking-widest text-gray-900 dark:text-white">{coupon.code}</span>
                <button
                  onClick={() => handleCopy(coupon.code)}
                  className="p-1 rounded text-gray-400 hover:text-violet-600 transition-colors"
                  title="Copy code"
                >
                  {copied === coupon.code ? <span className="text-xs text-emerald-500">✓</span> : <FiCopy className="h-4 w-4" />}
                </button>
              </div>
              {coupon.discountType !== 'free shipping' && (
                <p className="text-3xl font-black text-violet-600 dark:text-violet-400 mt-1">
                  {coupon.discountType === 'percentage' ? `${coupon.discountAmount}% OFF` : `₹${coupon.discountAmount} OFF`}
                </p>
              )}
              {coupon.discountType === 'free shipping' && (
                <p className="text-xl font-black text-violet-600 dark:text-violet-400 mt-1">FREE SHIPPING</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Min. order {coupon.minPurchase}</p>
            </div>

            {/* Bottom Section */}
            <div className="relative z-20 px-4 pt-6 pb-4 bg-gray-50 dark:bg-gray-800/40">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{coupon.usageCount || 0} / {coupon.usageLimit} uses</span>
                <span>Expires {new Date(coupon.expiresAt).toLocaleDateString()}</span>
              </div>
              {/* Usage bar */}
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                  style={{ width: `${Math.min((coupon.usageCount || 0 / coupon.usageLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
              <button onClick={() => {
                  setEditingId(coupon._id);
                  setForm({
                    code: coupon.code,
                    type: coupon.discountType === 'percentage' ? 'Percentage' : coupon.discountType === 'fixed' ? 'Fixed' : 'Free Shipping',
                    value: coupon.discountAmount?.toString() || '',
                    minOrder: coupon.minPurchase?.toString() || '',
                    limit: coupon.usageLimit?.toString() || '',
                    expires: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ''
                  });
                  setShowModal(true);
                }} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-violet-600 hover:border-violet-400 transition-colors shadow-sm">
                <FiEdit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(coupon._id)} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-600 hover:border-red-400 transition-colors shadow-sm">
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Coupon Code *</label>
                <input
                  required
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option>Percentage</option>
                    <option>Fixed</option>
                    <option>Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {form.type === 'Percentage' ? 'Discount %' : form.type === 'Fixed' ? 'Amount (₹)' : 'Value'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="0"
                    disabled={form.type === 'Free Shipping'}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrder}
                    onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.limit}
                    onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                    placeholder="100"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  value={form.expires}
                  onChange={e => setForm(f => ({ ...f, expires: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                  {editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;

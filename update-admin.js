const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/admin/AdminCoupons.tsx';
let content = fs.readFileSync(path, 'utf8');

// Imports
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport { api } from '../../services/api';\nimport { notifySuccess, notifyError } from '../../components/Toast';"
);

// Remove static coupons
content = content.replace(/const coupons = \[\s*\{.*?\}\s*\];/s, '');

// Update component start
content = content.replace(
  'export const AdminCoupons: React.FC = () => {',
  `export const AdminCoupons: React.FC = () => {
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
`
);

// Update handleAdd
content = content.replace(
  /const handleAdd = \(e: React.FormEvent\) => \{[\s\S]*?setShowModal\(false\);\s*\};/,
  `const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        code: form.code,
        discountType: form.type.toLowerCase(),
        discountAmount: Number(form.value),
        minPurchase: Number(form.minOrder),
        usageLimit: Number(form.limit),
        expiresAt: form.expires ? new Date(form.expires).toISOString() : undefined,
        isActive: true
      });
      notifySuccess('Coupon created successfully');
      setShowModal(false);
      setForm({ code: '', type: 'Percentage', value: '', minOrder: '', limit: '', expires: '' });
      fetchCoupons();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(\`/coupons/\${id}\`);
      notifySuccess('Coupon deleted successfully');
      fetchCoupons();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };`
);

// Update mapping
content = content.replace(
  /<div key=\{coupon\.id\}/g,
  '<div key={coupon._id}'
);

content = content.replace(
  /\{coupon\.status === 'Expired'/g,
  '{(!coupon.isActive || new Date(coupon.expiresAt) < new Date())'
);
content = content.replace(
  /\{coupon\.status === 'Active'/g,
  '{(coupon.isActive && new Date(coupon.expiresAt) >= new Date())'
);
content = content.replace(
  /coupon\.status === 'Active'/g,
  '(coupon.isActive && new Date(coupon.expiresAt) >= new Date())'
);
content = content.replace(
  /coupon\.status === 'Expired'/g,
  '(!coupon.isActive || new Date(coupon.expiresAt) < new Date())'
);

content = content.replace(
  /statusColors\[coupon\.status\]/g,
  "statusColors[(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'Active' : 'Expired']"
);

content = content.replace(
  /\{coupon\.status\}/g,
  "{(coupon.isActive && new Date(coupon.expiresAt) >= new Date()) ? 'Active' : 'Expired'}"
);

content = content.replace(
  /\{coupon\.type\}/g,
  "{coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed'}"
);

content = content.replace(
  /coupon\.type === 'Percentage'/g,
  "coupon.discountType === 'percentage'"
);
content = content.replace(
  /coupon\.type === 'Free Shipping'/g,
  "coupon.discountType === 'free shipping'"
);
content = content.replace(
  /coupon\.type !== 'Free Shipping'/g,
  "coupon.discountType !== 'free shipping'"
);

content = content.replace(
  /coupon\.value/g,
  'coupon.discountAmount'
);

content = content.replace(
  /coupon\.minOrder/g,
  'coupon.minPurchase'
);

content = content.replace(
  /coupon\.uses/g,
  'coupon.usageCount || 0'
);

content = content.replace(
  /coupon\.limit/g,
  'coupon.usageLimit'
);

content = content.replace(
  /coupon\.expires/g,
  'new Date(coupon.expiresAt).toLocaleDateString()'
);

// Delete button binding
content = content.replace(
  /<button className=\"p-1\.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-600 hover:border-red-400 transition-colors shadow-sm\">[\s\S]*?<FiTrash2 className=\"h-3\.5 w-3\.5\" \/>[\s\S]*?<\/button>/,
  `<button onClick={() => handleDelete(coupon._id)} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-600 hover:border-red-400 transition-colors shadow-sm">
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>`
);

// Stat counts fix
content = content.replace(
  /coupons\.filter\(c => c\.status === 'Active'\)\.length/,
  'coupons.filter(c => c.isActive && new Date(c.expiresAt) >= new Date()).length'
);
content = content.replace(
  /coupons\.filter\(c => c\.status === 'Expired'\)\.length/,
  'coupons.filter(c => !c.isActive || new Date(c.expiresAt) < new Date()).length'
);
content = content.replace(
  /coupons\.reduce\(\(a, c\) => a \+ c\.uses, 0\)/,
  'coupons.reduce((a, c) => a + (c.usageCount || 0), 0)'
);


fs.writeFileSync(path, content);
console.log('AdminCoupons.tsx updated');

const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/admin/AdminCoupons.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add editingId state
content = content.replace(
  "const [showModal, setShowModal] = useState(false);",
  "const [showModal, setShowModal] = useState(false);\n  const [editingId, setEditingId] = useState<string | null>(null);"
);

// Update Modal trigger
content = content.replace(
  /onClick=\{\(\) => setShowModal\(true\)\}/,
  `onClick={() => { setEditingId(null); setForm({ code: '', type: 'Percentage', value: '', minOrder: '', limit: '', expires: '' }); setShowModal(true); }}`
);

// Replace handleAdd with handleSave
content = content.replace(
  /const handleAdd = async \(e: React\.FormEvent\) => \{[\s\S]*?notifyError\(err\.response\?\.data\?\.message \|\| 'Failed to create coupon'\);\n    \}\n  \};\n/,
  `const handleSave = async (e: React.FormEvent) => {
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
        await api.put(\`/coupons/\${editingId}\`, payload);
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
`
);

// Form submission handler
content = content.replace(
  /<form onSubmit=\{handleAdd\} className=\"space-y-4\">/,
  `<form onSubmit={handleSave} className="space-y-4">`
);

content = content.replace(
  /<h3 className=\"text-lg font-bold text-gray-900 dark:text-white\">Create Coupon<\/h3>/,
  `<h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h3>`
);

content = content.replace(
  /<button type=\"submit\" className=\"flex-1 py-2\.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors\">\s*Create Coupon\s*<\/button>/,
  `<button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                  {editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>`
);


// Edit button onClick
content = content.replace(
  /<button className=\"p-1\.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-violet-600 hover:border-violet-400 transition-colors shadow-sm\">\s*<FiEdit2 className=\"h-3\.5 w-3\.5\" \/>\s*<\/button>/,
  `<button onClick={() => {
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
              </button>`
);

fs.writeFileSync(path, content);
console.log('Edit fixed');

import React, { useState } from 'react';
import { FiSave, FiGlobe, FiMail, FiShield, FiCreditCard, FiTruck, FiBell } from 'react-icons/fi';

const tabs = [
  { id: 'general', label: 'General', icon: FiGlobe },
  { id: 'email', label: 'Email', icon: FiMail },
  { id: 'payment', label: 'Payment', icon: FiCreditCard },
  { id: 'shipping', label: 'Shipping', icon: FiTruck },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'security', label: 'Security', icon: FiShield },
];

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  // General settings state
  const [general, setGeneral] = useState({
    storeName: 'eShop Premium',
    storeEmail: 'admin@eshop.com',
    storePhone: '+91 98765 43210',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'English',
    taxRate: '18.0',
    maintenanceMode: false,
  });

  // Email settings
  const [email, setEmail] = useState<{
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    fromName: string;
    orderConfirmation: boolean;
    shippingUpdate: boolean;
    promotionalEmails: boolean;
  }>({
    smtpHost: 'smtp.example.com',
    smtpPort: '587',
    smtpUser: 'noreply@eshop.com',
    fromName: 'eShop Team',
    orderConfirmation: true,
    shippingUpdate: true,
    promotionalEmails: false,
  });

  // Payment settings
  const [payment, setPayment] = useState<{
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    codEnabled: boolean;
    stripePK: string;
    paypalClientId: string;
  }>({
    stripeEnabled: true,
    paypalEnabled: true,
    codEnabled: false,
    stripePK: 'pk_test_*********************',
    paypalClientId: 'AXXxxxxxxxx',
  });

  // Shipping settings
  const [shipping, setShipping] = useState({
    freeShippingThreshold: '50',
    defaultRate: '5.99',
    expressRate: '14.99',
    internationalEnabled: true,
    processingDays: '1-2',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your store configuration</p>
        </div>
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
            saved ? 'bg-emerald-600' : 'bg-violet-600 hover:bg-violet-700'
          }`}
        >
          <FiSave className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:w-48 shrink-0">
          <nav className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">General Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Store Name</label>
                  <input className={inputCls} value={general.storeName} onChange={e => setGeneral(g => ({ ...g, storeName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Store Email</label>
                  <input type="email" className={inputCls} value={general.storeEmail} onChange={e => setGeneral(g => ({ ...g, storeEmail: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input className={inputCls} value={general.storePhone} onChange={e => setGeneral(g => ({ ...g, storePhone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select className={inputCls} value={general.currency} onChange={e => setGeneral(g => ({ ...g, currency: e.target.value }))}>
                    {['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Timezone</label>
                  <select className={inputCls} value={general.timezone} onChange={e => setGeneral(g => ({ ...g, timezone: e.target.value }))}>
                    {['Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tax Rate (%)</label>
                  <input type="number" min="0" step="0.1" className={inputCls} value={general.taxRate} onChange={e => setGeneral(g => ({ ...g, taxRate: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Maintenance Mode</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Temporarily close the storefront to customers</p>
                </div>
                <Toggle checked={general.maintenanceMode} onChange={() => setGeneral(g => ({ ...g, maintenanceMode: !g.maintenanceMode }))} />
              </div>
            </div>
          )}

          {/* Email */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">Email & SMTP Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>SMTP Host</label>
                  <input className={inputCls} value={email.smtpHost} onChange={e => setEmail(m => ({ ...m, smtpHost: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>SMTP Port</label>
                  <input className={inputCls} value={email.smtpPort} onChange={e => setEmail(m => ({ ...m, smtpPort: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>SMTP Username</label>
                  <input className={inputCls} value={email.smtpUser} onChange={e => setEmail(m => ({ ...m, smtpUser: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>From Name</label>
                  <input className={inputCls} value={email.fromName} onChange={e => setEmail(m => ({ ...m, fromName: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Notifications</h4>
                {[
                  { key: 'orderConfirmation' as const, label: 'Order Confirmation Emails', desc: 'Send automatic emails when customer places an order' },
                  { key: 'shippingUpdate' as const, label: 'Shipping Update Emails', desc: 'Notify customers when their order status changes' },
                  { key: 'promotionalEmails' as const, label: 'Marketing & Promotional Emails', desc: 'Send newsletters and special discount offers' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                    </div>
                    <Toggle checked={email[item.key]} onChange={() => setEmail(m => ({ ...m, [item.key]: !m[item.key] }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment */}
          {activeTab === 'payment' && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">Payment Gateways</h3>
              <div className="space-y-3">
                {[
                  { key: 'stripeEnabled' as const, label: 'Stripe (Credit / Debit Cards, Apple Pay)', desc: 'Accept worldwide card payments securely via Stripe' },
                  { key: 'paypalEnabled' as const, label: 'PayPal Express Checkout', desc: 'Allow customers to pay with PayPal balance and cards' },
                  { key: 'codEnabled' as const, label: 'Cash on Delivery (COD)', desc: 'Allow customers to pay upon package delivery' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                    </div>
                    <Toggle checked={payment[item.key]} onChange={() => setPayment(p => ({ ...p, [item.key]: !p[item.key] }))} />
                  </div>
                ))}
              </div>
              <div>
                <label className={labelCls}>Stripe Public Key</label>
                <input className={inputCls} type="password" value={payment.stripePK} onChange={e => setPayment(p => ({ ...p, stripePK: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>PayPal Client ID</label>
                <input className={inputCls} type="password" value={payment.paypalClientId} onChange={e => setPayment(p => ({ ...p, paypalClientId: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Shipping */}
          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">Shipping Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Free Shipping Threshold (₹)</label>
                  <input type="number" className={inputCls} value={shipping.freeShippingThreshold} onChange={e => setShipping(s => ({ ...s, freeShippingThreshold: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Standard Rate (₹)</label>
                  <input type="number" step="0.01" className={inputCls} value={shipping.defaultRate} onChange={e => setShipping(s => ({ ...s, defaultRate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Express Rate (₹)</label>
                  <input type="number" step="0.01" className={inputCls} value={shipping.expressRate} onChange={e => setShipping(s => ({ ...s, expressRate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Processing Time</label>
                  <input className={inputCls} value={shipping.processingDays} onChange={e => setShipping(s => ({ ...s, processingDays: e.target.value }))} placeholder="e.g. 1-2 business days" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">International Shipping</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Enable shipping to international destinations</p>
                </div>
                <Toggle checked={shipping.internationalEnabled} onChange={() => setShipping(s => ({ ...s, internationalEnabled: !s.internationalEnabled }))} />
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">Admin Notifications</h3>
              <div className="space-y-3">
                {[
                  { label: 'New Order Placed', desc: 'Notify when a new order is placed', enabled: true },
                  { label: 'Low Stock Alert', desc: 'Alert when product stock falls below 10', enabled: true },
                  { label: 'New Customer Registered', desc: 'Notify on new customer signup', enabled: false },
                  { label: 'Review Submitted', desc: 'Notify when a new review is submitted', enabled: true },
                  { label: 'Refund Request', desc: 'Notify on refund/return requests', enabled: true },
                  { label: 'Daily Sales Report', desc: 'Receive daily summary email', enabled: false },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-900/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{n.desc}</p>
                    </div>
                    <Toggle checked={n.enabled} onChange={() => {}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input type="password" className={inputCls} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" className={inputCls} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" className={inputCls} placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin login', enabled: false },
                  { label: 'Login Notifications', desc: 'Email on new admin login', enabled: true },
                  { label: 'Session Timeout', desc: 'Auto-logout after 30 min inactivity', enabled: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.desc}</p>
                    </div>
                    <Toggle checked={s.enabled} onChange={() => {}} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => alert('Password updated! (Demo)')}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
              >
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

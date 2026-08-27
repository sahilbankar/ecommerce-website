import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiTwitter, FiFacebook, FiInstagram, FiGithub } from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcApplePay } from 'react-icons/fa';
import { notifySuccess } from './Toast';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      notifySuccess('Thank you for subscribing to our newsletter!');
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Newsletter (Span 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400">
              <span>🛒</span>
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-400">
                E-SHOP
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Your one-stop destination for premium products, exclusive deals, and fast global delivery.
            </p>
            <form onSubmit={handleSubscribe} className="flex max-w-md gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-primary-900/50"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shrink-0"
              >
                <FiSend className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Column 1: Shop */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              Shop
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=newest" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Featured Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              Support
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/orders" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  Returns & Refunds
                </span>
              </li>
              <li>
                <span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  Help & FAQs
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  About Us
                </span>
              </li>
              <li>
                <span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} E-SHOP. All rights reserved.</p>

          {/* Social Icons */}
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <FiTwitter className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <FiFacebook className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <FiInstagram className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <FiGithub className="h-4 w-4" />
            </a>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center space-x-3 text-2xl text-gray-400">
            <FaCcVisa title="Visa" />
            <FaCcMastercard title="Mastercard" />
            <FaCcPaypal title="PayPal" />
            <FaCcApplePay title="Apple Pay" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

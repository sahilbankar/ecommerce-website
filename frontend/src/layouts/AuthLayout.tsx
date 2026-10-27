import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Left side: Premium Branding Column (Visible only on desktop lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 to-indigo-800 dark:from-primary-950 dark:to-indigo-950 items-center justify-center p-12 overflow-hidden">
        {/* Abstract shapes / gradients for visuals */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative max-w-md text-white text-center lg:text-left space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-200 hover:text-white transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <h2 className="text-4xl font-extrabold tracking-tight leading-none text-white">
            Welcome to <span className="underline decoration-indigo-400 decoration-wavy">Shri Home Decor</span>
          </h2>

          <p className="text-base text-primary-100 font-medium">
            Discover curate products, exclusive collections, and lightning-fast checkouts designed around your shopping lifestyle.
          </p>

          <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6 text-xs text-primary-200">
            <div>
              <p className="font-bold text-white text-sm mb-0.5">Free Shipping</p>
              <p>On all orders above $50</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-0.5">Secure Payments</p>
              <p>SSL encrypted checkout gateway</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-0.5">24/7 Support</p>
              <p>Dedicated customer care team</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-0.5">Easy Returns</p>
              <p>30 days return warranty policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login / Registration Form Card (Centered on mobile, right column on desktop) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900 transition-all">
          <div className="flex justify-between items-center lg:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <span className="text-lg font-bold tracking-tight text-primary-600 dark:text-primary-400">
              🛒 Shree Home Decor
            </span>
          </div>

          <div className="hidden lg:block text-center mb-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl shadow-inner dark:bg-primary-950">
              🛒
            </span>
          </div>

          <div className="relative">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

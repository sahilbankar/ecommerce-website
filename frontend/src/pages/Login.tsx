import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { FiUser, FiShield, FiArrowLeft } from 'react-icons/fi';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { AppDispatch, RootState } from '../redux/store';
import { Input } from '../components/Input';
import Button from '../components/Button';
import { notifySuccess, notifyError } from '../components/Toast';
import { api } from '../services/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type UserRoleOption = 'customer' | 'admin' | null;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);
  const [selectedRole, setSelectedRole] = useState<UserRoleOption>(null);

  // Customer Form Hook
  const {
    register: registerCustomer,
    handleSubmit: handleSubmitCustomer,
    formState: { errors: customerErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Admin Form Hook
  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    formState: { errors: adminErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormValues, expectedRole: 'customer' | 'admin') => {
    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { user, accessToken } = response.data.data;
      const mappedUser = {
        ...user,
        id: user._id || user.id,
      };

      if (expectedRole === 'admin' && mappedUser.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }

      dispatch(loginSuccess({ user: mappedUser, token: accessToken }));
      notifySuccess(response.data.message || `Signed in successfully as ${mappedUser.name}!`);

      if (mappedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data as { message?: string; errors?: string[] };
        errorMessage =
          responseData.message ||
          (Array.isArray(responseData.errors) ? responseData.errors.join(', ') : null) ||
          error.message ||
          errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(loginFailure(errorMessage));
      notifyError(errorMessage);
    }
  };

  const onCustomerSubmit = (data: LoginFormValues) => {
    return handleLogin(data, 'customer');
  };

  const onAdminSubmit = (data: LoginFormValues) => {
    return handleLogin(data, 'admin');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Option Selection View */}
      {selectedRole === null && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Sign In
            </h2>
            <p className="mt-1.5 text-xs text-gray-500">
              Please choose how you want to sign in to your account
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <FiUser className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Sign in as Customer
                  </h3>
                  <p className="text-xs text-gray-500">
                    Access your orders, cart, and wishlist
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                Continue &rarr;
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FiShield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Sign in as Administrator
                  </h3>
                  <p className="text-xs text-gray-500">
                    Manage store catalog, orders, and settings
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Continue &rarr;
              </span>
            </button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-primary-600 hover:underline dark:text-primary-400"
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      {/* Customer Login Form */}
      {selectedRole === 'customer' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              Change Role
            </button>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <FiUser className="h-3 w-3" /> Customer
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Customer Sign In
            </h2>
            <p className="mt-1.5 text-xs text-gray-500">
              Access your personalized dashboard and orders tracking
            </p>
          </div>

          <form onSubmit={handleSubmitCustomer(onCustomerSubmit)} className="space-y-4">
            <div>
              <Input
                label="Email Address"
                type="email"
                {...registerCustomer('email')}
                error={customerErrors.email?.message}
                placeholder="customer@eshop.com"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                {...registerCustomer('password')}
                error={customerErrors.password?.message}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-bold text-primary-600 hover:underline dark:text-primary-400"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={loading}
                fullWidth
              >
                Sign In as Customer
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-primary-600 hover:underline dark:text-primary-400"
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      {/* Administrator Login Form */}
      {selectedRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              Change Role
            </button>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <FiShield className="h-3 w-3" /> Administrator
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Administrator Sign In
            </h2>
            <p className="mt-1.5 text-xs text-gray-500">
              Access the administrator management portal
            </p>
          </div>

          <form onSubmit={handleSubmitAdmin(onAdminSubmit)} className="space-y-4">
            <div>
              <Input
                label="Administrator Email"
                type="email"
                {...registerAdmin('email')}
                error={adminErrors.email?.message}
                placeholder="admin@eshop.com"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                {...registerAdmin('password')}
                error={adminErrors.password?.message}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={loading}
                fullWidth
              >
                Sign In as Administrator
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-gray-500">
            Need assistance?{' '}
            <Link
              to="/forgot-password"
              className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Reset admin password
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Input } from '../components/Input';
import Button from '../components/Button';
import { notifySuccess, notifyError } from '../components/Toast';
import { api } from '../services/api';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      notifyError('Invalid or missing password reset token. Please check your reset link.');
      return;
    }

    if (password.length < 6) {
      notifyError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      notifyError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/auth/reset-password/${token}`, { password });
      notifySuccess(response.data.message || 'Your password has been successfully updated!');
      navigate('/login');
    } catch (error: unknown) {
      let errorMessage = 'Password reset failed. Please request a new link.';
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
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Reset Password
        </h2>
        <p className="mt-1.5 text-xs text-gray-500">
          Enter and verify your new account security password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <Button type="submit" isLoading={loading} fullWidth>
            Reset Password
          </Button>
        </div>
      </form>

      <div className="text-center text-xs text-gray-500">
        Back to{' '}
        <Link
          to="/login"
          className="font-bold text-primary-600 hover:underline dark:text-primary-400"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;

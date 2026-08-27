import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Input } from '../components/Input';
import Button from '../components/Button';
import { notifySuccess, notifyError } from '../components/Toast';
import { api } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      notifySuccess(response.data.message || `A password recovery link has been sent to ${email}!`);
      setEmail('');
    } catch (error: unknown) {
      let errorMessage = 'Failed to send password reset email. Please try again.';
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
          Forgot Password
        </h2>
        <p className="mt-1.5 text-xs text-gray-500">
          Enter your registered email address to receive a verification reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />

        <div className="pt-2">
          <Button type="submit" isLoading={loading} fullWidth>
            Send Reset Link
          </Button>
        </div>
      </form>

      <div className="text-center text-xs text-gray-500">
        Remembered your password?{' '}
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

export default ForgotPassword;

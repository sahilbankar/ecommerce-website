import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { loginSuccess } from '../redux/slices/authSlice';
import { AppDispatch } from '../redux/store';
import { Input } from '../components/Input';
import Button from '../components/Button';
import { notifySuccess, notifyError } from '../components/Toast';
import { api } from '../services/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const { user, accessToken } = response.data.data;
      const mappedUser = {
        ...user,
        id: user._id || user.id,
      };

      dispatch(loginSuccess({ user: mappedUser, token: accessToken }));
      notifySuccess(response.data.message || `Account created successfully! Welcome, ${mappedUser.name}.`);
      navigate('/');
    } catch (error: unknown) {
      let errorMessage = 'Registration failed. Please try again.';
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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Create Account
        </h2>
        <p className="mt-1.5 text-xs text-gray-500">
          Sign up to unlock personalized ordering and tracking features
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email Address"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Confirm Password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <div className="pt-2">
          <Button type="submit" isLoading={loading} fullWidth>
            Create Account
          </Button>
        </div>
      </form>

      <div className="text-center text-xs text-gray-500">
        Already have an account?{' '}
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

export default Register;

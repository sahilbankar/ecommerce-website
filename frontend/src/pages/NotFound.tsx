import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiAlertCircle } from 'react-icons/fi';
import Button from '../components/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center dark:bg-gray-950 px-4 transition-colors">
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 h-80 w-80 rounded-full bg-primary-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

      <div className="relative space-y-6 max-w-md">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400 shadow-inner mb-2">
          <FiAlertCircle className="h-9 w-9" />
        </div>

        <h1 className="text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Page Not Found
          </h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            The page path you requested does not exist or may have been moved to another index directory.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => navigate('/')}
            leftIcon={<FiHome className="h-4 w-4" />}
          >
            Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

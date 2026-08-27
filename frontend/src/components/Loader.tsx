import React from 'react';
import { CgSpinner } from 'react-icons/cg';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'text-primary-600 dark:text-primary-400',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
    xl: 'h-14 w-14',
  };

  return <CgSpinner className={`animate-spin ${sizeClasses[size]} ${color} ${className}`} />;
};

export const PulseLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="h-3 w-3 rounded-full bg-primary-600 animate-ping" />
    </div>
  );
};

export const DotsLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce" />
    </div>
  );
};

export interface FullPageLoaderProps {
  text?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
      <Spinner size="xl" />
      {text && (
        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Spinner;

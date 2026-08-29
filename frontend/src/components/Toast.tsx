import React from 'react';
import toast, { Toaster as HotToaster } from 'react-hot-toast';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

export const ToasterContainer: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      containerStyle={{
        top: 80,
        right: 16,
      }}
      toastOptions={{
        duration: 4000,
        className: 'dark:bg-gray-900 dark:text-gray-100 dark:border dark:border-gray-800',
        style: {
          borderRadius: '12px',
          background: '#ffffff',
          color: '#1f2937',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      }}
    />
  );
};

export const notifySuccess = (message: string) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-emerald-100 dark:border-emerald-900/30 p-4`}
    >
      <div className="flex-1 w-0 flex items-center">
        <div className="flex-shrink-0 pt-0.5">
          <FiCheckCircle className="h-6 w-6 text-emerald-500" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
        </div>
      </div>
    </div>
  ));
};

export const notifyError = (message: string) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-red-100 dark:border-red-900/30 p-4`}
    >
      <div className="flex-1 w-0 flex items-center">
        <div className="flex-shrink-0 pt-0.5">
          <FiAlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
        </div>
      </div>
    </div>
  ));
};

export const notifyWarning = (message: string) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-amber-100 dark:border-amber-900/30 p-4`}
    >
      <div className="flex-1 w-0 flex items-center">
        <div className="flex-shrink-0 pt-0.5">
          <FiAlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
        </div>
      </div>
    </div>
  ));
};

export const notifyInfo = (message: string) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-sky-100 dark:border-sky-900/30 p-4`}
    >
      <div className="flex-1 w-0 flex items-center">
        <div className="flex-shrink-0 pt-0.5">
          <FiInfo className="h-6 w-6 text-sky-500" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
        </div>
      </div>
    </div>
  ));
};

export default ToasterContainer;

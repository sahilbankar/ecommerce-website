const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
// If running on localhost and envBaseUrl points to remote or default, prioritize localhost in dev mode
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = (isLocalhost && import.meta.env.DEV)
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5000/api/v1')
  : (envBaseUrl || 'http://localhost:5000/api/v1');

export const APP_NAME = 'Shree Home Decor';

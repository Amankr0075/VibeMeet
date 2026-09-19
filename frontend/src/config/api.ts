// API configuration
// In development, empty API_BASE uses relative paths proxied by Vite dev server (/api -> http://localhost:5000/api)
// which eliminates CORS, hostname, and IPv4/IPv6 mismatch issues.
export const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

export const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  // If in browser, use current origin (proxied by Vite) or fallback to localhost:5000
  if (typeof window !== 'undefined' && window.location && window.location.port === '5175') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

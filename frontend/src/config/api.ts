// API configuration
// In development, empty API_BASE uses relative paths proxied by Vite dev server (/api -> http://localhost:5000/api)
// which eliminates CORS, hostname, and IPv4/IPv6 mismatch issues.
export const API_BASE = import.meta.env.VITE_API_URL !== undefined
  ? String(import.meta.env.VITE_API_URL).trim().replace(/\/$/, '')
  : '';

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

// Free ngrok tunnels show an HTML interstitial to browser fetch requests unless
// this header is present. Keep it centralized so authenticated admin requests
// and ordinary API requests both reach the real backend JSON endpoints.
export const apiFetch = (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  if (API_BASE.includes('.ngrok-free.app') || API_BASE.includes('.ngrok.io')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }
  return fetch(apiUrl(path), { ...init, headers });
};

export const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return String(import.meta.env.VITE_SOCKET_URL).trim().replace(/\/$/, '');
  }

  // Deployed Vercel clients cannot use localhost:5000: that address points to
  // the visitor's own device. When an API host is configured, use that same
  // public host for Socket.IO unless a dedicated socket URL is supplied.
  if (API_BASE) {
    try {
      return new URL(API_BASE, window.location.origin).origin;
    } catch {
      // Fall through to the local development default below.
    }
  }
  // If in browser, use current origin (proxied by Vite) or fallback to localhost:5000
  if (typeof window !== 'undefined' && window.location && window.location.port === '5175') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

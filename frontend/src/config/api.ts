// API configuration
// The live backend tunnel URL — used as fallback when deployed on remote host (e.g. Vercel)
const LIVE_BACKEND_URL = 'https://zodiac-snooper-cornfield.ngrok-free.dev';

export const isLocalHost = (): boolean => {
  if (typeof window === 'undefined' || !window.location) return true;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  );
};

// In development (localhost/LAN), API_BASE is empty — Vite dev server proxies /api -> localhost:5000
// In production (Vercel), VITE_API_URL is set in .env.production -> live backend URL
export const API_BASE = (() => {
  // If running locally, always use Vite's dev proxy (relative paths)
  if (isLocalHost()) {
    return '';
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return String(envUrl).trim().replace(/\/$/, '');
  }

  // Deployed on Vercel or remote host
  return LIVE_BACKEND_URL;
})();

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

/**
 * Safely parse JSON from a response. If the response is HTML or non-JSON
 * (such as a 502/503 from a proxy or gateway), throws a descriptive error
 * instead of letting JSON.parse crash with "Unexpected token '<', '<!DOCTYPE...'".
 */
export const safeJson = async <T = any>(res: Response): Promise<T> => {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(`Server is temporarily unavailable (${res.status}). Please ensure the backend is running.`);
      }
      if (res.status === 404) {
        throw new Error('API endpoint not found (404). Please ensure the backend is running.');
      }
      throw new Error(`Server error (${res.status}): ${res.statusText || 'Unexpected error'}`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Server returned an unexpected non-JSON response.');
    }
  }

  try {
    return await res.json() as T;
  } catch {
    throw new Error('Failed to parse server response as JSON.');
  }
};

// Free ngrok tunnels show an HTML interstitial to browser fetch requests unless
// this header is present. Always include it so API calls reach the real backend.
export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  headers.set('ngrok-skip-browser-warning', 'true');

  const url = apiUrl(path);

  try {
    const res = await fetch(url, { ...init, headers });
    // If Vercel proxy returned a gateway error in production, try direct live backend as fallback
    if (!res.ok && (res.status === 502 || res.status === 504) && !isLocalHost() && !url.startsWith(LIVE_BACKEND_URL)) {
      const fallback = `${LIVE_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
      return await fetch(fallback, { ...init, headers });
    }
    return res;
  } catch (err: any) {
    // Only attempt live backend fallback if we are on a remote host (not local dev)
    if (!isLocalHost() && !url.startsWith(LIVE_BACKEND_URL)) {
      try {
        const fallback = `${LIVE_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
        return await fetch(fallback, { ...init, headers });
      } catch {
        // fall through
      }
    }
    throw new Error('Unable to reach the server. Please check your connection or ensure backend is running.');
  }
};

export const getSocketUrl = (): string => {
  // Local dev / LAN: use current origin (proxied by Vite)
  if (isLocalHost()) {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'http://localhost:5000';
  }

  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl) {
    return String(envSocketUrl).trim().replace(/\/$/, '');
  }

  if (API_BASE) {
    try {
      return new URL(API_BASE, window.location.origin).origin;
    } catch {
      // fall through
    }
  }

  return LIVE_BACKEND_URL;
};

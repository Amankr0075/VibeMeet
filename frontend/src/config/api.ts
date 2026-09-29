// API configuration
const LIVE_BACKEND_URL = 'https://zodiac-snooper-cornfield.ngrok-free.dev';

// In development, empty API_BASE uses relative paths proxied by Vite dev server (/api -> http://localhost:5000/api).
// When deployed on Vercel/public host, defaults to the live backend tunnel.
export const API_BASE = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '')
  ? String(import.meta.env.VITE_API_URL).trim().replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? LIVE_BACKEND_URL
      : '');

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

// Free ngrok tunnels show an HTML interstitial to browser fetch requests unless
// this header is present. Set it unconditionally so authenticated requests, admin
// dashboard data fetching, and API calls always reach the real backend.
export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  const primaryUrl = apiUrl(path);

  try {
    const res = await fetch(primaryUrl, { ...init, headers });
    // If Vercel proxy returned 502/504 on non-localhost, try direct ngrok as fallback
    if (!res.ok && (res.status === 502 || res.status === 504) && !primaryUrl.startsWith(LIVE_BACKEND_URL)) {
      const fallbackUrl = `${LIVE_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
      return await fetch(fallbackUrl, { ...init, headers });
    }
    return res;
  } catch (err) {
    // If primary failed with "Failed to fetch" (e.g. proxy timeout/network blip), fallback
    if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const fallbackUrl = primaryUrl.startsWith(LIVE_BACKEND_URL)
        ? (path.startsWith('/') ? path : `/${path}`)
        : `${LIVE_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
      return await fetch(fallbackUrl, { ...init, headers });
    }
    throw err;
  }
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

  // When deployed to production (e.g. Vercel), connect socket directly to the live backend tunnel
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return LIVE_BACKEND_URL;
  }

  // If in browser local dev, use current origin (proxied by Vite) or fallback to localhost:5000
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

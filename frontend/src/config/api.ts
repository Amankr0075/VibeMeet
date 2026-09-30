// API configuration
// The live backend tunnel URL — used as fallback when env var is not set
const LIVE_BACKEND_URL = 'https://zodiac-snooper-cornfield.ngrok-free.dev';

// In development (localhost), API_BASE is empty — Vite dev server proxies /api -> localhost:5000
// In production (Vercel), VITE_API_URL is set in .env.production -> ngrok URL
// If VITE_API_URL is not set in production, fallback to LIVE_BACKEND_URL for non-localhost hosts
export const API_BASE = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return String(envUrl).trim().replace(/\/$/, '');
  }
  // On Vercel/deployed, use the live backend URL directly
  if (typeof window !== 'undefined' && window.location &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1') {
    return LIVE_BACKEND_URL;
  }
  // Local dev: empty string means use relative /api paths (proxied by Vite)
  return '';
})();

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

// Free ngrok tunnels show an HTML interstitial to browser fetch requests unless
// this header is present. Always include it so API calls reach the real backend.
export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  headers.set('ngrok-skip-browser-warning', 'true');

  const url = apiUrl(path);

  try {
    const res = await fetch(url, { ...init, headers });
    // If Vercel proxy returned a gateway error, try direct ngrok as fallback
    if (!res.ok && (res.status === 502 || res.status === 504) && !url.startsWith(LIVE_BACKEND_URL)) {
      const fallback = `${LIVE_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
      return await fetch(fallback, { ...init, headers });
    }
    return res;
  } catch {
    // Network error — try direct ngrok if we weren't already hitting it
    if (!url.startsWith(LIVE_BACKEND_URL)) {
      const fallback = `${LIVE_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
      return await fetch(fallback, { ...init, headers });
    }
    throw new Error('Unable to reach the server. Please check your connection.');
  }
};

export const getSocketUrl = (): string => {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl) {
    return String(envSocketUrl).trim().replace(/\/$/, '');
  }

  // If API_BASE is set, derive socket URL from it
  if (API_BASE) {
    try {
      return new URL(API_BASE, window.location.origin).origin;
    } catch {
      // fall through
    }
  }

  // Deployed on non-localhost: connect socket directly to live backend
  if (typeof window !== 'undefined' && window.location &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1') {
    return LIVE_BACKEND_URL;
  }

  // Local dev: use current origin (proxied by Vite)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

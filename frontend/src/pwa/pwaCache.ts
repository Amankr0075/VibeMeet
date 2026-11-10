// ─────────────────────────────────────────────────────────────
// pwaCache.ts — Local-first caching utilities for VibeMeet PWA
// All heavy/frequent data is stored locally to avoid re-fetching
// from the server on every page load.
// ─────────────────────────────────────────────────────────────

const PREFIX = 'vm_';

// ── Generic helpers ───────────────────────────────────────────

function key(k: string) {
  return PREFIX + k;
}

function setItem<T>(k: string, value: T, ttlSeconds?: number): void {
  try {
    const payload = {
      v: value,
      ts: Date.now(),
      ttl: ttlSeconds ? ttlSeconds * 1000 : null,
    };
    localStorage.setItem(key(k), JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

function getItem<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(key(k));
    if (!raw) return null;
    const payload = JSON.parse(raw) as { v: T; ts: number; ttl: number | null };
    if (payload.ttl !== null && Date.now() - payload.ts > payload.ttl) {
      localStorage.removeItem(key(k));
      return null;
    }
    return payload.v;
  } catch {
    return null;
  }
}

function removeItem(k: string): void {
  try {
    localStorage.removeItem(key(k));
  } catch {
    // ignore
  }
}

// ── User profile ──────────────────────────────────────────────

export interface CachedUser {
  _id: string;
  name?: string;
  username?: string;
  email: string;
  bio?: string;
  gender?: string;
  profileImage?: string;
  preferredGender?: string;
  preferredCommunity?: string;
  isCollegeStudent?: boolean;
  institutionName?: string;
  role: string;
  accountStatus: string;
}

export const cacheUser = (user: CachedUser): void =>
  setItem('user', user); // no TTL — stays until logout

export const getCachedUser = (): CachedUser | null => getItem<CachedUser>('user');

export const clearCachedUser = (): void => removeItem('user');

// ── Auth token ───────────────────────────────────────────────

export const cacheToken = (token: string): void =>
  setItem('token', token); // no TTL — stays until logout

export const getCachedToken = (): string | null => getItem<string>('token');

export const clearCachedToken = (): void => removeItem('token');

// ── Online user count ─────────────────────────────────────────

export const cacheOnlineCount = (count: number): void =>
  setItem('online_count', count, 30); // 30-second TTL

export const getCachedOnlineCount = (): number | null =>
  getItem<number>('online_count');

// ── UI preferences ────────────────────────────────────────────

export interface UiPreferences {
  isChatOpenDefault?: boolean;
  videoOnDefault?: boolean;
  audioOnDefault?: boolean;
  dismissedInstallPrompt?: boolean;
  installPromptDismissedAt?: number;
}

export const saveUiPrefs = (prefs: Partial<UiPreferences>): void => {
  const existing = getItem<UiPreferences>('ui_prefs') ?? {};
  setItem('ui_prefs', { ...existing, ...prefs });
};

export const getUiPrefs = (): UiPreferences =>
  getItem<UiPreferences>('ui_prefs') ?? {};

// ── PWA install prompt helper ────────────────────────────────

/** Returns true if the user dismissed the install banner < 7 days ago */
export const wasInstallDismissedRecently = (): boolean => {
  const prefs = getUiPrefs();
  if (!prefs.dismissedInstallPrompt) return false;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - (prefs.installPromptDismissedAt ?? 0) < sevenDays;
};

export const dismissInstallPrompt = (): void => {
  saveUiPrefs({
    dismissedInstallPrompt: true,
    installPromptDismissedAt: Date.now(),
  });
};

// ── Clear all app cache (logout) ─────────────────────────────

export const clearAllAppCache = (): void => {
  clearCachedUser();
  clearCachedToken();
  removeItem('online_count');
  // Preserve UI prefs across logout so install prompt isn't re-shown immediately
};


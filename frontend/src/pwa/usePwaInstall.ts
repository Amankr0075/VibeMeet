// ─────────────────────────────────────────────────────────────
// usePwaInstall.ts — Hook to manage PWA install prompt lifecycle
// Works on Android Chrome/Edge. iOS is handled via meta tags
// (no JS prompt on iOS, user does it via "Add to Home Screen").
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { dismissInstallPrompt, wasInstallDismissedRecently } from './pwaCache';

type InstallState = 'idle' | 'available' | 'installing' | 'installed' | 'unsupported';

interface UsePwaInstallReturn {
  installState: InstallState;
  canPrompt: boolean;
  isIos: boolean;
  isStandalone: boolean;
  triggerInstall: () => Promise<void>;
  dismissBanner: () => void;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installState, setInstallState] = useState<InstallState>('idle');

  // Detect iOS Safari
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Detect if already running in standalone mode (already installed)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) {
      setInstallState('installed');
      return;
    }

    // iOS: prompt is handled via UI hint (no JS API)
    if (isIos) {
      setInstallState('available');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallState('available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstallState('installed');
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone, isIos]);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstallState('installing');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallState(outcome === 'accepted' ? 'installed' : 'available');
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    dismissInstallPrompt();
    setInstallState('idle');
  }, []);

  const canPrompt =
    installState === 'available' &&
    !isStandalone &&
    !wasInstallDismissedRecently();

  return {
    installState,
    canPrompt,
    isIos,
    isStandalone,
    triggerInstall,
    dismissBanner,
  };
}


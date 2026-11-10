import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { registerSW } from 'virtual:pwa-register';

// ── PWA Auto-Registration & Offline Capability ────────────────────────────────
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[VibeMeet PWA] New content available.');
  },
  onOfflineReady() {
    console.log('[VibeMeet PWA] App is cached and ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

// ─────────────────────────────────────────────────────────────
// InstallBanner.tsx
// Animated install-to-home-screen banner for Android and iOS.
// Shows on first visit; hides after install or dismiss (7 days).
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { usePwaInstall } from '../pwa/usePwaInstall';

export const InstallBanner: React.FC = () => {
  const { canPrompt, isIos, isStandalone, triggerInstall, dismissBanner, installState } =
    usePwaInstall();
  const [visible, setVisible] = useState(false);

  // Delay banner appearance slightly for better UX
  useEffect(() => {
    if (!canPrompt || isStandalone) return;
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [canPrompt, isStandalone]);

  if (!visible || isStandalone || installState === 'installed') return null;

  const handleDismiss = () => {
    setVisible(false);
    dismissBanner();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(calc(100vw - 2rem), 420px)',
        animation: 'bannerSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes bannerSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(2rem); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .install-banner-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 0.4rem; padding: 0.6rem 1.4rem; border-radius: 9999px;
          font-size: 0.875rem; font-weight: 700; cursor: pointer;
          border: none; transition: transform 0.15s, filter 0.15s;
        }
        .install-banner-btn:hover { transform: scale(1.04); filter: brightness(1.1); }
        .install-banner-btn:active { transform: scale(0.97); }
      `}</style>

      <div
        style={{
          background: 'rgba(10, 15, 30, 0.95)',
          border: '1px solid rgba(236,72,153,0.3)',
          borderRadius: '1.5rem',
          padding: '1rem 1.1rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(236,72,153,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/icons/icon-72.png"
            alt="VibeMeet"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              flexShrink: 0,
              boxShadow: '0 0 20px rgba(236,72,153,0.4)',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Install VibeMeet
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '1px' }}>
              Add to your home screen for the best experience
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* iOS instruction */}
        {isIos ? (
          <div
            style={{
              background: 'rgba(236,72,153,0.08)',
              border: '1px solid rgba(236,72,153,0.2)',
              borderRadius: '1rem',
              padding: '0.75rem',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              lineHeight: 1.55,
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}
          >
            <Share size={16} style={{ color: '#ec4899', flexShrink: 0, marginTop: '1px' }} />
            <span>
              Tap the <strong style={{ color: '#f472b6' }}>Share</strong> button in Safari, then
              {' '}<strong style={{ color: '#f472b6' }}>Add to Home Screen</strong>{' '}
              <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
          </div>
        ) : (
          /* Android / Chrome: native install button */
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="install-banner-btn"
              onClick={triggerInstall}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                color: 'white',
              }}
            >
              <Download size={16} />
              {installState === 'installing' ? 'Installing…' : 'Install App'}
            </button>
            <button
              className="install-banner-btn"
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Not now
            </button>
          </div>
        )}

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['⚡ Instant load', '📡 Works offline', '🔔 Notifications'].map((pill) => (
            <span
              key={pill}
              style={{
                fontSize: '0.68rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};


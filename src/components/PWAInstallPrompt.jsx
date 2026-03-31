import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowBigDownDash, Share } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { t } = useAuth();

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // If iOS, we check if it's already in standalone mode
    if (isIOSDevice) {
      const isStandalone = window.navigator.standalone === true;
      if (!isStandalone) {
        // Check if user dismissed it recently (last 24 hours)
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
        if (!dismissedAt || Date.now() - parseInt(dismissedAt) > 24 * 60 * 60 * 1000) {
          setTimeout(() => setIsVisible(true), 3000);
        }
      }
    }

    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      
      // Check if user dismissed it recently
      const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissedAt || Date.now() - parseInt(dismissedAt) > 24 * 60 * 60 * 1000) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="pwa-install-overlay">
      <div className="pwa-install-card">
        <button className="pwa-close-btn" onClick={handleDismiss}>
          <X size={20} />
        </button>

        <div className="pwa-content">
          <div className="pwa-icon-container">
            <div className="pwa-app-logo">
              <img src="/favicon.png" alt="App Logo" />
            </div>
          </div>

          <div className="pwa-text">
            <h3>{t('install_app_title') || 'Install Aavinam App'}</h3>
            <p>{t('install_app_desc') || 'Get the best experience by installing our app on your home screen.'}</p>
          </div>

          {isIOS ? (
            <div className="pwa-ios-instructions">
              <div className="ios-step">
                <span className="step-num">1</span>
                <p>Tap <Share size={18} className="ios-icon" /> in the browser bar</p>
              </div>
              <div className="ios-step">
                <span className="step-num">2</span>
                <p>Scroll down and tap <strong>Add to Home Screen</strong></p>
              </div>
            </div>
          ) : (
            <button className="pwa-install-btn" onClick={handleInstallClick}>
              <Download size={20} />
              <span>{t('install_now') || 'Install Now'}</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .pwa-install-overlay {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          padding: 16px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .pwa-install-card {
          pointer-events: auto;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2),
                      0 0 0 1px rgba(0, 0, 0, 0.05);
          position: relative;
          animation: pwaSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes pwaSlideUp {
          from { transform: translateY(100%) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .pwa-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #64748b;
          transition: all 0.2s;
        }

        .pwa-close-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .pwa-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        .pwa-app-logo {
          width: 64px;
          height: 64px;
          background: white;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 4px;
        }

        .pwa-app-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .pwa-text h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 4px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pwa-text p {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.5;
          max-width: 280px;
          margin: 0 auto;
        }

        .pwa-install-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          border-radius: 16px;
          transition: all 0.3s;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .pwa-install-btn:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
        }

        .pwa-install-btn:active {
          transform: translateY(0);
        }

        .pwa-ios-instructions {
          width: 100%;
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .ios-step {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-num {
          width: 24px;
          height: 24px;
          background: #2563eb;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .ios-step p {
          font-size: 0.85rem;
          color: #475569;
          margin: 0;
          max-width: none;
        }

        .ios-icon {
          display: inline-block;
          vertical-align: middle;
          color: #2563eb;
        }

        strong {
          color: #1e293b;
        }

        @media (max-width: 640px) {
          .pwa-install-overlay {
            padding: 12px;
          }
          .pwa-install-card {
            border-radius: 28px;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;

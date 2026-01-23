import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    // Show prompt after 30 seconds if installable and not dismissed
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002868] to-[#001a44] px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1 text-white">
            <h3 className="font-semibold text-lg">Install Lib Event Hub</h3>
            <p className="text-white/80 text-sm">Get the full app experience</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Quick access from your home screen
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Works offline - view tickets anytime
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Get event reminders & notifications
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Faster loading & better performance
            </li>
          </ul>

          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 text-white bg-[#CE1126] hover:bg-[#a80d1f] rounded-lg font-medium transition-colors"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Hide after a short delay when coming back online
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-500' : 'bg-yellow-500'
    }`}>
      <div className="container mx-auto px-4 py-2 text-center text-sm font-medium text-white flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <span>✓</span>
            <span>You're back online</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span>You're offline - Some features may be unavailable</span>
          </>
        )}
      </div>
    </div>
  );
}

export default InstallPrompt;

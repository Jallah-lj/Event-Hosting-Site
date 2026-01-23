import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIosStandalone);
    };

    checkInstalled();
    
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Prompt to install the app
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (vapidPublicKey: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        });
      }

      setPushSubscription(subscription);
      return subscription.toJSON() as PushSubscriptionJSON;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
        setPushSubscription(null);
        return true;
      } catch (error) {
        console.error('Error unsubscribing from push:', error);
        return false;
      }
    }
    return false;
  }, [pushSubscription]);

  // Show a local notification
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ) => {
    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [notificationPermission, requestNotificationPermission]);

  // Check for service worker updates
  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        return true;
      } catch (error) {
        console.error('Error checking for updates:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Clear all caches
  const clearCaches = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        return true;
      } catch (error) {
        console.error('Error clearing caches:', error);
        return false;
      }
    }
    return false;
  }, []);

  return {
    // State
    isInstallable,
    isInstalled,
    isOnline,
    notificationPermission,
    isPushSubscribed: !!pushSubscription,
    
    // Actions
    promptInstall,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    checkForUpdates,
    clearCaches
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

export default usePWA;

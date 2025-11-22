'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  // Check browser support (never changes, so no need for state)
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  // Register service worker and setup push notifications
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW available, show update prompt
              console.log('New service worker available');
            }
          });
        }
      });

      await navigator.serviceWorker.ready;

      // Listen for messages from service worker (for navigation)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'navigate') {
          // Scroll to referrals section
          const referralSection = document.querySelector('#referrals');
          if (referralSection) {
            referralSection.scrollIntoView({ behavior: 'smooth' });
          }
          // Also navigate to the home page if not already there
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      });

      setIsServiceWorkerReady(true);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!isServiceWorkerReady) {
      console.log('Service worker not ready yet');
      return;
    }

    try {
      await navigator.serviceWorker.ready;

      // Get VAPID keys from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDefault_VAPID_Public_Key_For_Development';

      // Store subscription preferences (for future real push implementation)
      const response = await fetch('/api/notification/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user', // In real implementation, get from user auth
          vapidPublicKey: vapidPublicKey,
          enabled: true,
          preferences: {
            referralNotifications: true,
            milestoneNotifications: true,
            weeklySummaries: false
          }
        }),
      });

      if (response.ok) {
        console.log('Push notification preferences saved on server');
      } else {
        console.error('Failed to save notification preferences');
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }, [isServiceWorkerReady]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported || !('Notification' in window)) {
      toast.error('Push notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('🎉 Push notifications enabled! Stay updated on your referral progress.', {
          duration: 4000,
        });
        await registerServiceWorker();
        await subscribeToPush();
        return true;
      } else if (result === 'denied') {
        toast.error('Push notifications denied. You can enable them in browser settings.', {
          duration: 5000,
        });
        return false;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported, registerServiceWorker, subscribeToPush]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        toast.success('Push notifications disabled');
      } catch (error) {
        console.error('Unsubscribe failed:', error);
      }
    }
  }, [subscription]);

  // Send test notification (for development)
  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }

    try {
      // Show browser notification directly
      new Notification('🎉 Referral Test!', {
        body: 'Push notifications are working! You\'ll get real updates when friends join.',
        icon: '/favicon.ico',
        tag: 'referral-test',
        requireInteraction: false,
      });

      toast.success('Test notification sent! Check your browser.');
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notification');
    }
  }, [permission]);

  // Helper to send referral notification
  const sendReferralNotification = useCallback(async (data: {
    referrerEmail: string;
    referredName: string;
    bonusMonths: number;
    totalReferrals: number;
  }) => {
    if (permission !== 'granted') return;

    try {
      await fetch('/api/notification/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send referral notification:', error);
    }
  }, [permission]);

  // Helper to send milestone notification
  const sendMilestoneNotification = useCallback(async (data: {
    userEmail: string;
    milestoneName: string;
    bonusMonths: number;
    totalRewards: number;
  }) => {
    if (permission !== 'granted') return;

    try {
      await fetch('/api/notification/milestone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send milestone notification:', error);
    }
  }, [permission]);

  return {
    // State
    permission,
    subscription,
    isSupported,
    isServiceWorkerReady,

    // Actions
    requestPermission,
    unsubscribeFromPush,
    sendTestNotification,
    sendReferralNotification,
    sendMilestoneNotification,

    // Helpers
    isEnabled: permission === 'granted' && isSupported,
  };
}

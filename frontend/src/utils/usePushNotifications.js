import { useState, useEffect } from 'react';
import axios from 'axios';

// Utility to convert Base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

export function usePushNotifications(user) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  
  const PUBLIC_VAPID_KEY = "BNSzUkFr3uvlaKbgAYMdXDlJ7X9B3XiLTfGDpT3Eqyhiy11obmfXkYQeUpfTOgXKSOwRYTQoemn0jOSCFQ09V4k";

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setPermission(Notification.permission);
      
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(sub !== null);
        });
      });
    }
  }, []);

  const subscribeUser = async () => {
    if (!user) return;
    
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'}/api/push/subscribe`,
        { subscription: sub, deviceInfo: navigator.userAgent },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setIsSubscribed(true);
      setPermission('granted');
    } catch (err) {
      console.error('Push Subscription failed:', err);
    }
  };

  return { isSubscribed, permission, subscribeUser };
}

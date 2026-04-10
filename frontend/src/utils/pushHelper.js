/**
 * pushHelper.js
 * Standalone (non-hook) push subscription utility.
 * Safe to call from AuthContext (outside React hook component context).
 */

const PUBLIC_VAPID_KEY = "BNSzUkFr3uvlaKbgAYMdXDlJ7X9B3XiLTfGDpT3Eqyhiy11obmfXkYQeUpfTOgXKSOwRYTQoemn0jOSCFQ09V4k";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Call after login, register, or session restore.
 * Requests notification permission and registers push subscription with the backend.
 * Uses relative /api path — routed via Next.js proxy to the backend.
 */
export async function subscribeUserToPush(user) {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!user) return;

  try {
    // Request permission (shows browser prompt if not yet granted/denied)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    const token = localStorage.getItem('skystay_token');
    if (!token) return;

    // Use relative URL — Next.js proxies /api/* → backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: sub, deviceInfo: navigator.userAgent }),
    });

    console.log('[SkyStay] Push notifications activated ✅');
  } catch (err) {
    // Silently fail — never break login flow
    console.warn('[SkyStay] Push subscription skipped:', err.message);
  }
}

"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

export function PushSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsSubscribed(true);
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
      if (isSubscribed) {
        showToast("Already Subscribed!");
        setIsSubscribing(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permission denied');

      const registration = await navigator.serviceWorker.ready;
      const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey)
      });

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, timezone: tz })
      });

      setIsSubscribed(true);
      showToast("Alerts Enabled!");
    } catch (e) {
      console.error(e);
      showToast("Notifications blocked/unsupported.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="relative flex shrink-0">
      <button
        onClick={handleSubscribe}
        disabled={isSubscribing}
        className={`flex shrink-0 w-[52px] h-[52px] sm:w-14 sm:h-14 items-center justify-center font-bold rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 ${
          isSubscribed 
            ? 'bg-green-500 text-white ring-1 ring-green-600' 
            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
        }`}
        title={isSubscribed ? "Subscribed to Daily Push" : "Get Notified for New Daily Puzzle"}
      >
        {isSubscribing ? (
          <span className="animate-pulse">...</span>
        ) : isSubscribed ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>

      {/* Floating UI Toast replacing the native alert() */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

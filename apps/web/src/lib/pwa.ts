import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function registerPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({ immediate: true });
  }
}

function getOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useNetworkStatus() {
  return useSyncExternalStore(subscribeOnline, getOnline, () => true);
}

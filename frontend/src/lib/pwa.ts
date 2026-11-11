// Service Worker Registration and PWA Utilities

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Register in production or when supported
  const onLoad = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // SW registered
        if (import.meta.env?.DEV) {
          // eslint-disable-next-line no-console
          console.log('[PWA] Service Worker registered:', registration.scope);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad);
  }
}

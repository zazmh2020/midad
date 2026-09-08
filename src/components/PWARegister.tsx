'use client';

import { useEffect } from 'react';

/** يسجّل عامل الخدمة لتفعيل التثبيت كتطبيق (PWA). */
export default function PWARegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // في التطوير: لا نُسجّل عامل الخدمة، ونُلغي أي تسجيل سابق ونمسح ذاكرته،
    // لأن كاش الأصول الثابتة يخدم نسخًا قديمة من حِزم التطوير (CSS/JS).
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if (typeof caches !== 'undefined') {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* تجاهل — المراقبة ثانوية */
      });
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}

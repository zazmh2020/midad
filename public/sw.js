/* عامل خدمة مِداد — يفعّل التثبيت (PWA) ويسرّع الأصول الثابتة فقط.
   لا يخزّن صفحات HTML أو RSC أو طلبات API أو المصادقة (تبقى شبكة مباشرة). */
const STATIC_CACHE = 'midad-static-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  // كاش-أولًا للأصول الثابتة غير المتغيّرة فقط
  const isStatic =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/fonts') ||
    url.pathname.startsWith('/bg');
  if (!isStatic) return; // كل ما عداه: سلوك الشبكة الافتراضي

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return hit || Response.error();
      }
    })(),
  );
});

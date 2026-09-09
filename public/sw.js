/* عامل خدمة مِداد — «مِفتاح إيقاف ذاتي».
   يُلغي تسجيل نفسه ويمسح كل الذاكرة المخزّنة، لتفادي تقديم نسخ قديمة من الأصول
   (CSS/JS) أثناء التطوير والتجربة. لا يوجد معالج fetch، فكل الطلبات تمرّ للشبكة. */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          try { client.navigate(client.url); } catch { /* تجاهل */ }
        }
      } catch {
        /* تجاهل */
      }
    })(),
  );
});

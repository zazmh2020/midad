import { NextRequest, NextResponse } from 'next/server';

/**
 * يوجّه الطلبات بحسب الدومين الفرعي:
 *
 *   midad.localhost:3000            →  الموقع التعريفي (لا تغيير)
 *   admin.midad.localhost:3000      →  لوحة مالك المنصة (/admin/*)
 *   alqoran.midad.localhost:3000    →  مساحة المؤسسة (/org/*)
 *
 * يعيد الكتابة الداخلية (rewrite) — الرابط في المتصفح يبقى نظيفًا،
 * لكن Next.js يعرض الصفحة الصحيحة.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');
  const url = request.nextUrl.clone();

  // المسارات التي يجب ألّا يمسّها الـ middleware
  const path = url.pathname;
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/fonts') ||
    path === '/login' || // صفحة الدخول مشتركة — تُعرض كما هي على أي دومين فرعي
    path.includes('.') // ملفات ثابتة (صور، خطوط...)
  ) {
    return NextResponse.next();
  }

  // لا دومين فرعي → الموقع التعريفي
  if (parts.length < 3) {
    return NextResponse.next();
  }

  const subdomain = parts[0];

  // لوحة مالك المنصة
  if (subdomain === 'admin') {
    // إعادة الكتابة: /  →  /admin
    if (!path.startsWith('/admin')) {
      url.pathname = `/admin${path === '/' ? '' : path}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // كلمات محجوزة أخرى
  if (['www', 'api', 'app'].includes(subdomain)) {
    return NextResponse.next();
  }

  // دومين فرعي لمؤسسة → أعد الكتابة إلى /org/[slug]
  if (!path.startsWith('/org/')) {
    url.pathname = `/org/${subdomain}${path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * تطبيق middleware على كل المسارات ما عدا:
     * - _next/static, _next/image, favicon
     * - أي ملف يحوي نقطة (ملفات ثابتة)
     */
    '/((?!_next/static|_next/image|favicon.ico|hero.webp|hero.jpg).*)',
  ],
};

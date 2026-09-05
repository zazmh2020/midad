import { NextRequest, NextResponse } from 'next/server';

/**
 * يوجّه الطلبات بحسب الدومين الفرعي ضمن دومينات مِداد الجذر فقط:
 *
 *   midad.app / midad.localhost            →  الموقع التعريفي
 *   admin.midad.app                        →  لوحة مالك المنصة (/admin/*)
 *   alqoran.midad.app                      →  مساحة المؤسسة (/org/*)
 *
 * أي دومين آخر (مثل *.vercel.app أو معاينات Vercel) → الموقع التعريفي مباشرةً،
 * حتى لا يُفسَّر اسم مشروع Vercel على أنه مؤسسة (كان يسبّب 404).
 */

// دومينات الجذر التي يُفعَّل عليها التوجيه بالدومين الفرعي.
// يمكن تجاوزها بمتغيّر البيئة APP_ROOT_DOMAINS (مفصولة بفواصل).
const ROOT_DOMAINS = (process.env.APP_ROOT_DOMAINS ?? 'midad.localhost,midad.app')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** يعيد المقطع الفرعي (subdomain) إن كان المضيف تحت أحد دومينات الجذر، وإلا null. */
function extractSubdomain(hostname: string): string | null {
  for (const root of ROOT_DOMAINS) {
    if (hostname === root) return null; // الجذر نفسه → لا دومين فرعي
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, hostname.length - root.length - 1);
      return sub.split('.')[0] || null; // أول مقطع فقط
    }
  }
  return null; // ليس تحت أي دومين جذر معروف (vercel.app، localhost، إلخ)
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // مسارات لا يمسّها التوجيه
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/fonts') ||
    path.startsWith('/site') || // الموقع العام للمؤسسات — بلا مصادقة
    path === '/privacy' ||      // صفحات قانونية عامة
    path === '/terms' ||
    path === '/login' ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(hostname);

  // لا دومين فرعي ضمن مِداد → الموقع التعريفي (يشمل *.vercel.app والدومين الرئيسي)
  if (!subdomain || ['www', 'api', 'app'].includes(subdomain)) {
    return NextResponse.next();
  }

  // لوحة مالك المنصة
  if (subdomain === 'admin') {
    if (!path.startsWith('/admin')) {
      url.pathname = `/admin${path === '/' ? '' : path}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // دومين فرعي لمؤسسة → /org/[slug]
  if (!path.startsWith('/org/')) {
    url.pathname = `/org/${subdomain}${path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|hero.webp|hero.jpg).*)'],
};

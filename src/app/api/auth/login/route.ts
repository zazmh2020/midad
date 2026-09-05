import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieDomain } from '@/lib/session';

/** يبني وجهة ما بعد الدخول على المضيف الصحيح لكل دور */
function destinationFor(
  request: Request,
  role: string,
  slug: string | null,
): string {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];
  const port = host.includes(':') ? `:${host.split(':')[1]}` : '';
  const proto = new URL(request.url).protocol; // http: أو https:
  const base = sessionCookieDomain(host) ?? hostname;

  let targetHost = hostname;
  if (role === 'PLATFORM_OWNER') targetHost = `admin.${base}`;
  else if (slug) targetHost = `${slug}.${base}`;

  return `${proto}//${targetHost}${port}/`;
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string; remember?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'أدخل البريد الإلكتروني وكلمة المرور.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { slug: true, isActive: true } } },
  });

  // رسالة واحدة للحالتين — حتى لا نكشف أي بريد مسجّل وأيّها ليس كذلك
  const invalid = NextResponse.json(
    { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' },
    { status: 401 },
  );

  if (!user) return invalid;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return invalid;

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'هذا الحساب موقوف. تواصل مع إدارة مؤسستك.' },
      { status: 403 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // منع دخول مستخدم مؤسسة معطّلة
  if (user.organization && !user.organization.isActive) {
    return NextResponse.json(
      { error: 'مؤسستك موقوفة حالياً. تواصل مع إدارة مِداد.' },
      { status: 403 },
    );
  }

  await createSession(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationSlug: user.organization?.slug ?? null,
    },
    body.remember === true,
    sessionCookieDomain(request.headers.get('host')),
  );

  // علامة ترحيب تظهر مرّة واحدة بعد الدخول
  const domain = sessionCookieDomain(request.headers.get('host'));
  (await cookies()).set('midad_welcome', '1', { path: '/', maxAge: 120, ...(domain ? { domain } : {}) });

  const redirectTo = destinationFor(request, user.role, user.organization?.slug ?? null);
  return NextResponse.json({ ok: true, redirectTo });
}

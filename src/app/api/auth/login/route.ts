import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

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

  const user = await prisma.user.findUnique({ where: { email } });

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

  await createSession(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    body.remember === true,
  );

  return NextResponse.json({ ok: true });
}

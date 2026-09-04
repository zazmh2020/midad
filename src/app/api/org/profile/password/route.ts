import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';

/** تغيير كلمة المرور — للحساب نفسه، بعد التحقق من الحالية */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'كلمة المرور الجديدة: 8 محارف على الأقل.' }, { status: 400 });
  }

  const ok = await bcrypt.compare(currentPassword, actor.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: actor.id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}

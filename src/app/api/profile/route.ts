import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/** تعديل الملف الشخصي لأي مستخدم مسجّل (بالجلسة) — الاسم والصورة. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ error: 'الاسم قصير جداً.' }, { status: 400 });
  }

  let avatarUrl: string | null | undefined;
  if (body.avatarUrl !== undefined) {
    const raw = String(body.avatarUrl ?? '').trim();
    if (raw === '') {
      avatarUrl = null;
    } else if (/^https?:\/\/.+/i.test(raw) && raw.length <= 2048) {
      avatarUrl = raw;
    } else {
      return NextResponse.json({ error: 'رابط الصورة غير صالح (يجب أن يبدأ بـ http).' }, { status: 400 });
    }
  }

  const jobTitle = body.jobTitle !== undefined ? String(body.jobTitle ?? '').trim().slice(0, 120) || null : undefined;
  const phone = body.phone !== undefined ? String(body.phone ?? '').trim().slice(0, 40) || null : undefined;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(jobTitle !== undefined ? { jobTitle } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

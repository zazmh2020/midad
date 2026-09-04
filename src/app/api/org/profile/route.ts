import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';

/** تعديل الملف الشخصي — يعمل على حساب الفاعل نفسه فقط */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ error: 'الاسم قصير جداً.' }, { status: 400 });
  }

  // صورة الملف الشخصي (رابط اختياري) — قيمة فارغة تُزيل الصورة
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

  await prisma.user.update({
    where: { id: actor.id },
    data: { name, ...(avatarUrl !== undefined ? { avatarUrl } : {}) },
  });
  return NextResponse.json({ ok: true });
}

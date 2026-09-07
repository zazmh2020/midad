import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';

/** إرسال رسالة مباشرة لعضو في نفس الجهة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const toUserId = String(body.toUserId ?? '');
  const text = String(body.body ?? '').trim();
  if (text.length < 1) return NextResponse.json({ error: 'الرسالة فارغة.' }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: 'الرسالة طويلة جداً.' }, { status: 400 });
  if (toUserId === actor.id) return NextResponse.json({ error: 'لا يمكنك مراسلة نفسك.' }, { status: 400 });

  // عزل: المستلِم عضو نشط في نفس المؤسسة
  const recipient = await prisma.user.findFirst({
    where: { id: toUserId, organizationId: actor.organization.id, isActive: true },
    select: { id: true },
  });
  if (!recipient) return NextResponse.json({ error: 'المستلِم غير موجود.' }, { status: 400 });

  const msg = await prisma.message.create({
    data: {
      body: text,
      organizationId: actor.organization.id, // عزل
      senderId: actor.id,
      recipientId: recipient.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: msg.id });
}

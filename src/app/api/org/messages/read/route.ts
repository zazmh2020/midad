import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';

/** تعليم رسائل محادثة مع عضو معيّن كمقروءة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const withUserId = String(body?.withUserId ?? '');
  if (!withUserId) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  await prisma.message.updateMany({
    where: {
      organizationId: actor.organization.id,
      senderId: withUserId,
      recipientId: actor.id, // عزل: رسائل موجّهة لي فقط
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

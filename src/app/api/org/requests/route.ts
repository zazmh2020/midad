import { NextResponse } from 'next/server';
import type { RequestType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewRequests, isRequestType } from '@/lib/permissions';

/** تقديم طلب جديد — أي عضو في المؤسسة. */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canViewRequests(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const type = String(body.type ?? '');
  const details = String(body.details ?? '').trim();
  if (!isRequestType(type)) {
    return NextResponse.json({ error: 'نوع الطلب غير صالح.' }, { status: 400 });
  }

  const created = await prisma.memberRequest.create({
    data: {
      type: type as RequestType,
      details: details || null,
      requesterId: actor.id,
      organizationId: actor.organization.id, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: created.id });
}

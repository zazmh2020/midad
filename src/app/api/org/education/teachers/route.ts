import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const specialization = String(body.specialization ?? '').trim();

  if (name.length < 2) return NextResponse.json({ error: 'اسم المعلّم قصير جداً.' }, { status: 400 });

  const t = await prisma.teacher.create({
    data: {
      name,
      phone: phone || null,
      specialization: specialization || null,
      organizationId: actor.organization.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: t.id });
}

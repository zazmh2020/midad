import { NextResponse } from 'next/server';
import type { VolunteerStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageHR, isVolunteerStatus } from '@/lib/permissions';

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const skills = String(body.skills ?? '').trim();
  const status = String(body.status ?? 'ACTIVE');

  if (name.length < 2) return NextResponse.json({ error: 'اسم المتطوّع قصير جداً.' }, { status: 400 });
  if (!isVolunteerStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });

  const v = await prisma.volunteer.create({
    data: { name, phone: phone || null, skills: skills || null, status: status as VolunteerStatus, organizationId: actor.organization.id },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: v.id });
}

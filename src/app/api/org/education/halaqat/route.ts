import { NextResponse } from 'next/server';
import type { HalaqaType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isHalaqaType } from '@/lib/permissions';

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const type = String(body.type ?? 'MEMORIZATION');
  const schedule = String(body.schedule ?? '').trim();
  const teacherId = body.teacherId ? String(body.teacherId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الحلقة قصير جداً.' }, { status: 400 });
  if (!isHalaqaType(type)) return NextResponse.json({ error: 'النوع غير صالح.' }, { status: 400 });
  if (teacherId) {
    const t = await prisma.teacher.findFirst({ where: { id: teacherId, organizationId: orgId }, select: { id: true } });
    if (!t) return NextResponse.json({ error: 'المعلّم غير موجود.' }, { status: 400 });
  }

  const h = await prisma.halaqa.create({
    data: { name, type: type as HalaqaType, schedule: schedule || null, teacherId, organizationId: orgId },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: h.id });
}

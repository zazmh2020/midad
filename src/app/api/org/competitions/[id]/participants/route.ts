import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

/** إضافة مشارك لمسابقة. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const comp = await prisma.competition.findFirst({ where: { id, organizationId: actor.organization.id }, select: { id: true } });
  if (!comp) return NextResponse.json({ error: 'المسابقة غير موجودة.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? '').trim();
  if (name.length < 2) return NextResponse.json({ error: 'اسم المشارك قصير جداً.' }, { status: 400 });

  const p = await prisma.competitionParticipant.create({
    data: { name, competitionId: comp.id, organizationId: actor.organization.id },
    select: { id: true },
  });
  await prisma.competition.update({ where: { id: comp.id }, data: { participants: { increment: 1 } } });
  return NextResponse.json({ ok: true, id: p.id });
}

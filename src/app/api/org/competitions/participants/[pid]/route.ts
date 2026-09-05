import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

async function own(orgId: string, pid: string) {
  return prisma.competitionParticipant.findFirst({ where: { id: pid, organizationId: orgId } });
}

/** تعديل درجة/ترتيب مشارك. */
export async function PATCH(request: Request, { params }: { params: Promise<{ pid: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { pid } = await params;
  const target = await own(actor.organization.id, pid);
  if (!target) return NextResponse.json({ error: 'المشارك غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const data: { score?: number | null; note?: string | null } = {};
  if (body?.score !== undefined) {
    const n = body.score === '' || body.score === null ? null : Math.trunc(Number(body.score));
    if (n !== null && !Number.isFinite(n)) return NextResponse.json({ error: 'درجة غير صالحة.' }, { status: 400 });
    data.score = n;
  }
  if (body?.note !== undefined) data.note = String(body.note).trim() || null;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير.' }, { status: 400 });
  await prisma.competitionParticipant.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ pid: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { pid } = await params;
  const target = await own(actor.organization.id, pid);
  if (!target) return NextResponse.json({ error: 'المشارك غير موجود.' }, { status: 404 });
  await prisma.competitionParticipant.delete({ where: { id: target.id } });
  await prisma.competition.update({ where: { id: target.competitionId }, data: { participants: { decrement: 1 } } });
  return NextResponse.json({ ok: true });
}

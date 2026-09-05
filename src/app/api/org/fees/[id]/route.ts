import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageFees } from '@/lib/permissions';

async function own(orgId: string, id: string) {
  return prisma.studentFee.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageFees(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الرسم غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.paid !== 'boolean') return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  await prisma.studentFee.update({
    where: { id: target.id },
    data: { paid: body.paid, paidAt: body.paid ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageFees(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الرسم غير موجود.' }, { status: 404 });
  await prisma.studentFee.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

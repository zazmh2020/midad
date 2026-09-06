import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await prisma.memorizationEntry.findFirst({ where: { id, organizationId: actor.organization.id } });
  if (!target) return NextResponse.json({ error: 'السجل غير موجود.' }, { status: 404 });

  await prisma.memorizationEntry.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

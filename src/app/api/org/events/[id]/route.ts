import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEvents } from '@/lib/permissions';

async function own(orgId: string, id: string) {
  return prisma.event.findFirst({ where: { id, organizationId: orgId } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEvents(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الفعالية غير موجودة.' }, { status: 404 });
  await prisma.event.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

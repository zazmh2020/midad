import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

async function loadOwn(orgId: string, id: string) {
  return prisma.assessment.findFirst({ where: { id, organizationId: orgId } });
}

/** حذف تقييم */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'التقييم غير موجود.' }, { status: 404 });

  await prisma.assessment.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

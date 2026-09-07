import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageFinance } from '@/lib/permissions';

/** حذف حركة مالية */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageFinance(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const { id } = await params;
  // عزل: الحركة ضمن مؤسسة الفاعل
  const target = await prisma.financeTransaction.findFirst({
    where: { id, organizationId: actor.organization.id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'الحركة غير موجودة.' }, { status: 404 });

  await prisma.financeTransaction.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

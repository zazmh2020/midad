import { NextResponse } from 'next/server';
import type { ApprovalStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewApprovals, canDecideApprovals } from '@/lib/permissions';

async function loadOwn(actorOrgId: string, id: string) {
  // عزل: الاعتماد يجب أن يكون ضمن مؤسسة الفاعل
  return prisma.approval.findFirst({ where: { id, organizationId: actorOrgId } });
}

/** اتخاذ قرار على طلب اعتماد (اعتماد/رفض) — مدير المؤسسة فقط */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const decision = String(body.status ?? '');
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return NextResponse.json({ error: 'القرار غير صالح.' }, { status: 400 });
  }
  if (!canDecideApprovals(actor.role)) {
    return NextResponse.json({ error: 'اعتماد الطلبات مقصور على مدير المؤسسة.' }, { status: 403 });
  }

  await prisma.approval.update({
    where: { id: target.id },
    data: {
      status: decision as ApprovalStatus,
      decisionNote: String(body.decisionNote ?? '').trim() || null,
      decidedById: actor.id,
      decidedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}

/** حذف طلب اعتماد — مقدّم الطلب (وهو قيد الاعتماد) أو مدير المؤسسة */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canViewApprovals(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });

  const isOwnerPending = target.requestedById === actor.id && target.status === 'PENDING';
  if (!canDecideApprovals(actor.role) && !isOwnerPending) {
    return NextResponse.json({ error: 'لا يمكنك حذف هذا الطلب.' }, { status: 403 });
  }

  await prisma.approval.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

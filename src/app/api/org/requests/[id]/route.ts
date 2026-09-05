import { NextResponse } from 'next/server';
import type { RequestStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageRequests, canViewRequests, isRequestStatus } from '@/lib/permissions';

async function own(orgId: string, id: string) {
  return prisma.memberRequest.findFirst({ where: { id, organizationId: orgId } });
}

/** اعتماد/رفض طلب — مدير المؤسسة فقط. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageRequests(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { status?: RequestStatus; reply?: string | null } = {};
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isRequestStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    data.status = status;
  }
  if (body.reply !== undefined) data.reply = String(body.reply).trim() || null;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.memberRequest.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

/** حذف طلب — مقدّمه (وهو قيد المراجعة) أو مدير المؤسسة. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canViewRequests(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });

  const isOwnerPending = target.requesterId === actor.id && target.status === 'PENDING';
  if (!isOwnerPending && !canManageRequests(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  await prisma.memberRequest.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

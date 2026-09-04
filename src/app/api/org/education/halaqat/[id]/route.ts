import { NextResponse } from 'next/server';
import type { HalaqaType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isHalaqaType } from '@/lib/permissions';

async function own(orgId: string, id: string) {
  return prisma.halaqa.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await own(orgId, id);
  if (!target) return NextResponse.json({ error: 'الحلقة غير موجودة.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { name?: string; type?: HalaqaType; schedule?: string | null; teacherId?: string | null } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الحلقة قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.type !== undefined) {
    const type = String(body.type);
    if (!isHalaqaType(type)) return NextResponse.json({ error: 'النوع غير صالح.' }, { status: 400 });
    data.type = type;
  }
  if (body.schedule !== undefined) data.schedule = String(body.schedule).trim() || null;
  if (body.teacherId !== undefined) {
    const teacherId = body.teacherId ? String(body.teacherId) : null;
    if (teacherId) {
      const t = await prisma.teacher.findFirst({ where: { id: teacherId, organizationId: orgId }, select: { id: true } });
      if (!t) return NextResponse.json({ error: 'المعلّم غير موجود.' }, { status: 400 });
    }
    data.teacherId = teacherId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.halaqa.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الحلقة غير موجودة.' }, { status: 404 });

  await prisma.halaqa.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

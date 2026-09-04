import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageHR } from '@/lib/permissions';

async function own(orgId: string, id: string) {
  return prisma.team.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await own(orgId, id);
  if (!target) return NextResponse.json({ error: 'الفريق غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { name?: string; description?: string | null; lead?: string | null; departmentId?: string | null } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الفريق قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.description !== undefined) data.description = String(body.description).trim() || null;
  if (body.lead !== undefined) data.lead = String(body.lead).trim() || null;
  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      const d = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
      if (!d) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
    data.departmentId = departmentId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.team.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الفريق غير موجود.' }, { status: 404 });
  await prisma.team.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

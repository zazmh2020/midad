import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

async function own(orgId: string, id: string) {
  return prisma.teacher.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'المعلّم غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { name?: string; phone?: string | null; specialization?: string | null; isActive?: boolean; userId?: string | null } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم المعلّم قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
  if (body.specialization !== undefined) data.specialization = String(body.specialization).trim() || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.userId !== undefined) {
    const userId = body.userId ? String(body.userId) : null;
    if (userId) {
      // عزل: الحساب يجب أن يكون ضمن نفس المؤسسة
      const u = await prisma.user.findFirst({ where: { id: userId, organizationId: actor.organization.id }, select: { id: true } });
      if (!u) return NextResponse.json({ error: 'الحساب غير موجود.' }, { status: 400 });
      // حساب واحد لمعلّم واحد
      const taken = await prisma.teacher.findFirst({ where: { userId, NOT: { id: target.id } }, select: { id: true } });
      if (taken) return NextResponse.json({ error: 'هذا الحساب مرتبط بمعلّم آخر.' }, { status: 400 });
    }
    data.userId = userId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.teacher.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'المعلّم غير موجود.' }, { status: 404 });

  await prisma.teacher.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

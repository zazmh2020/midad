import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

async function ownStudentIds(orgId: string, ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids)) return [];
  const wanted = ids.map((x) => String(x));
  const rows = await prisma.student.findMany({
    where: { id: { in: wanted }, organizationId: orgId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function validUserId(orgId: string, guardianId: string, userId: unknown): Promise<string | null | undefined> {
  if (userId === null || userId === undefined || userId === '') return null;
  const id = String(userId);
  const u = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, guardianProfile: { select: { id: true } } },
  });
  if (!u) return undefined;
  if (u.guardianProfile && u.guardianProfile.id !== guardianId) return undefined; // مرتبط بغيره
  return id;
}

async function loadOwn(orgId: string, id: string) {
  return prisma.guardian.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
}

/** تعديل وليّ أمر: بياناته، حساب الدخول، وقائمة أبنائه */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const { id } = await params;
  const target = await loadOwn(orgId, id);
  if (!target) return NextResponse.json({ error: 'وليّ الأمر غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.fullName !== undefined) {
    const fullName = String(body.fullName).trim();
    if (fullName.length < 2) return NextResponse.json({ error: 'اسم وليّ الأمر قصير جداً.' }, { status: 400 });
    data.fullName = fullName;
  }
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
  if (body.email !== undefined) data.email = String(body.email).trim() || null;
  if (body.userId !== undefined) {
    const userId = await validUserId(orgId, target.id, body.userId);
    if (userId === undefined) return NextResponse.json({ error: 'حساب الدخول غير صالح أو مرتبط بوليّ أمر آخر.' }, { status: 400 });
    data.userId = userId;
  }

  // إعادة إسناد الأبناء: يُفصل من لم يعد ضمن القائمة، ويُوصل الجدد (ضمن المؤسسة فقط)
  if (body.studentIds !== undefined) {
    const ids = await ownStudentIds(orgId, body.studentIds);
    await prisma.$transaction([
      prisma.student.updateMany({ where: { guardianId: target.id, id: { notIn: ids } }, data: { guardianId: null } }),
      ...(ids.length ? [prisma.student.updateMany({ where: { id: { in: ids }, organizationId: orgId }, data: { guardianId: target.id } })] : []),
    ]);
  }

  if (Object.keys(data).length > 0) {
    await prisma.guardian.update({ where: { id: target.id }, data });
  }
  return NextResponse.json({ ok: true });
}

/** حذف وليّ أمر (يُفصل عن أبنائه تلقائيًا) */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'وليّ الأمر غير موجود.' }, { status: 404 });

  await prisma.guardian.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

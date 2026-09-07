import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

/** يتحقّق أن كل معرّفات الطلاب ضمن مؤسسة الفاعل ويعيدها منقّاة. */
async function ownStudentIds(orgId: string, ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const wanted = ids.map((x) => String(x));
  const rows = await prisma.student.findMany({
    where: { id: { in: wanted }, organizationId: orgId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** يتحقّق أن حساب الدخول (إن وُجد) عضو في نفس المؤسسة وغير مرتبط بوليّ أمر آخر. */
async function validUserId(orgId: string, userId: unknown): Promise<string | null | undefined> {
  if (userId === null || userId === undefined || userId === '') return null;
  const id = String(userId);
  const u = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, guardianProfile: { select: { id: true } } },
  });
  if (!u) return undefined; // غير موجود بالمؤسسة
  if (u.guardianProfile) return undefined; // مرتبط بوليّ أمر آخر
  return id;
}

/** إنشاء وليّ أمر داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const fullName = String(body.fullName ?? '').trim();
  if (fullName.length < 2) return NextResponse.json({ error: 'اسم وليّ الأمر قصير جداً.' }, { status: 400 });

  const userId = await validUserId(orgId, body.userId);
  if (userId === undefined) return NextResponse.json({ error: 'حساب الدخول غير صالح أو مرتبط بوليّ أمر آخر.' }, { status: 400 });

  const studentIds = await ownStudentIds(orgId, body.studentIds);

  const guardian = await prisma.guardian.create({
    data: {
      fullName,
      phone: String(body.phone ?? '').trim() || null,
      email: String(body.email ?? '').trim() || null,
      userId,
      organizationId: orgId,
      students: studentIds.length ? { connect: studentIds.map((id) => ({ id })) } : undefined,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: guardian.id });
}

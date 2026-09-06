import { NextResponse } from 'next/server';
import type { BeneficiaryCategory, BeneficiaryStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageBeneficiaries, isBeneficiaryCategory, isBeneficiaryStatus } from '@/lib/permissions';

/** إنشاء ملف مستفيد داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageBeneficiaries(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const nationalId = String(body.nationalId ?? '').trim();
  const notes = String(body.notes ?? '').trim();
  const category = String(body.category ?? 'FAMILY');
  const status = String(body.status ?? 'ACTIVE');
  const departmentId = body.departmentId ? String(body.departmentId) : null;
  const programId = body.programId ? String(body.programId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم المستفيد قصير جداً.' }, { status: 400 });
  if (!isBeneficiaryCategory(category)) return NextResponse.json({ error: 'التصنيف غير صالح.' }, { status: 400 });
  if (!isBeneficiaryStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });

  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
    if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }
  if (programId) {
    const prog = await prisma.program.findFirst({ where: { id: programId, organizationId: orgId }, select: { id: true } });
    if (!prog) return NextResponse.json({ error: 'البرنامج غير موجود.' }, { status: 400 });
  }

  const b = await prisma.beneficiary.create({
    data: {
      name,
      phone: phone || null,
      nationalId: nationalId || null,
      notes: notes || null,
      category: category as BeneficiaryCategory,
      status: status as BeneficiaryStatus,
      departmentId,
      programId,
      organizationId: orgId, // عزل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: b.id });
}

import { NextResponse } from 'next/server';
import type { StudentStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isStudentStatus } from '@/lib/permissions';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const guardianName = String(body.guardianName ?? '').trim();
  const guardianPhone = String(body.guardianPhone ?? '').trim();
  const status = String(body.status ?? 'ACTIVE');
  const halaqaId = body.halaqaId ? String(body.halaqaId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الطالب قصير جداً.' }, { status: 400 });
  if (!isStudentStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });

  const birthDate = parseDate(body.birthDate);
  if (birthDate === undefined) return NextResponse.json({ error: 'تاريخ الميلاد غير صالح.' }, { status: 400 });

  if (halaqaId) {
    const h = await prisma.halaqa.findFirst({ where: { id: halaqaId, organizationId: orgId }, select: { id: true } });
    if (!h) return NextResponse.json({ error: 'الحلقة غير موجودة.' }, { status: 400 });
  }

  const s = await prisma.student.create({
    data: {
      name,
      phone: phone || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
      birthDate,
      status: status as StudentStatus,
      halaqaId,
      organizationId: orgId,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: s.id });
}

import { NextResponse } from 'next/server';
import type { ProjectStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageProjects, isProjectStatus } from '@/lib/permissions';

/** يحوّل قيمة تاريخ (yyyy-mm-dd أو فارغة) إلى Date أو null، ويعيد undefined إن كانت غير صالحة */
function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** إنشاء مشروع داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageProjects(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const status = String(body.status ?? 'PLANNED');
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) {
    return NextResponse.json({ error: 'اسم المشروع قصير جداً.' }, { status: 400 });
  }
  if (!isProjectStatus(status)) {
    return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
  }

  // عزل: الوحدة (إن وُجدت) يجب أن تكون ضمن نفس المؤسسة
  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, organizationId: actor.organization.id },
      select: { id: true },
    });
    if (!dept) {
      return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
  }

  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);
  if (startDate === undefined || endDate === undefined) {
    return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
  }
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json(
      { error: 'تاريخ النهاية قبل تاريخ البداية.' },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      status: status as ProjectStatus,
      startDate,
      endDate,
      departmentId,
      organizationId: actor.organization.id, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: project.id });
}

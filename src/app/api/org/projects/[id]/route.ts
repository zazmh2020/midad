import { NextResponse } from 'next/server';
import type { ProjectStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageProjects, isProjectStatus } from '@/lib/permissions';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function loadOwnProject(actorOrgId: string, id: string) {
  // عزل: المشروع يجب أن يكون ضمن مؤسسة الفاعل
  return prisma.project.findFirst({ where: { id, organizationId: actorOrgId } });
}

/** تعديل مشروع */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageProjects(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwnProject(actor.organization.id, id);
  if (!target) {
    return NextResponse.json({ error: 'المشروع غير موجود.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    departmentId?: string | null;
  } = {};

  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      // عزل: الوحدة يجب أن تكون ضمن نفس المؤسسة
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: actor.organization.id },
        select: { id: true },
      });
      if (!dept) {
        return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
      }
    }
    data.departmentId = departmentId;
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return NextResponse.json({ error: 'اسم المشروع قصير جداً.' }, { status: 400 });
    }
    data.name = name;
  }

  if (body.description !== undefined) {
    const description = String(body.description).trim();
    data.description = description || null;
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isProjectStatus(status)) {
      return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    }
    data.status = status;
  }

  if (body.startDate !== undefined) {
    const d = parseDate(body.startDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
    data.startDate = d;
  }
  if (body.endDate !== undefined) {
    const d = parseDate(body.endDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
    data.endDate = d;
  }

  const start = data.startDate !== undefined ? data.startDate : target.startDate;
  const end = data.endDate !== undefined ? data.endDate : target.endDate;
  if (start && end && end < start) {
    return NextResponse.json(
      { error: 'تاريخ النهاية قبل تاريخ البداية.' },
      { status: 400 },
    );
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  await prisma.project.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

/** حذف مشروع */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageProjects(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwnProject(actor.organization.id, id);
  if (!target) {
    return NextResponse.json({ error: 'المشروع غير موجود.' }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

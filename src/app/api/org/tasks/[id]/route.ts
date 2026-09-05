import { NextResponse } from 'next/server';
import type { TaskStatus, TaskPriority } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageTasks, isTaskStatus, isTaskPriority } from '@/lib/permissions';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function loadOwnTask(actorOrgId: string, id: string) {
  // عزل: المهمة يجب أن تكون ضمن مؤسسة الفاعل
  return prisma.task.findFirst({ where: { id, organizationId: actorOrgId } });
}

/** تعديل مهمة */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageTasks(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwnTask(actor.organization.id, id);
  if (!target) {
    return NextResponse.json({ error: 'المهمة غير موجودة.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    assigneeId?: string | null;
    departmentId?: string | null;
  } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2) {
      return NextResponse.json({ error: 'عنوان المهمة قصير جداً.' }, { status: 400 });
    }
    data.title = title;
  }

  if (body.description !== undefined) {
    const description = String(body.description).trim();
    data.description = description || null;
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isTaskStatus(status)) {
      return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    }
    data.status = status;
  }

  if (body.priority !== undefined) {
    const priority = String(body.priority);
    if (!isTaskPriority(priority)) {
      return NextResponse.json({ error: 'الأولوية غير صالحة.' }, { status: 400 });
    }
    data.priority = priority;
  }

  if (body.assigneeId !== undefined) {
    const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    if (assigneeId) {
      const u = await prisma.user.findFirst({
        where: { id: assigneeId, organizationId: actor.organization.id },
        select: { id: true },
      });
      if (!u) return NextResponse.json({ error: 'المسؤول غير موجود.' }, { status: 400 });
    }
    data.assigneeId = assigneeId;
  }

  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: actor.organization.id },
        select: { id: true },
      });
      if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
    data.departmentId = departmentId;
  }

  if (body.dueDate !== undefined) {
    const d = parseDate(body.dueDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
    data.dueDate = d;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  await prisma.task.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

/** حذف مهمة */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageTasks(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwnTask(actor.organization.id, id);
  if (!target) {
    return NextResponse.json({ error: 'المهمة غير موجودة.' }, { status: 404 });
  }

  await prisma.task.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import type { TaskStatus, TaskPriority } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageTasks, isTaskStatus, isTaskPriority } from '@/lib/permissions';

/** يحوّل تاريخًا (yyyy-mm-dd أو فارغًا) إلى Date أو null، ويعيد undefined إن كان غير صالح */
function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** إنشاء مهمة داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageTasks(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const status = String(body.status ?? 'TODO');
  const priority = String(body.priority ?? 'MEDIUM');
  const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (title.length < 2) {
    return NextResponse.json({ error: 'عنوان المهمة قصير جداً.' }, { status: 400 });
  }
  if (!isTaskStatus(status)) {
    return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
  }
  if (!isTaskPriority(priority)) {
    return NextResponse.json({ error: 'الأولوية غير صالحة.' }, { status: 400 });
  }

  // عزل: المسؤول (إن وُجد) يجب أن يكون ضمن نفس المؤسسة
  if (assigneeId) {
    const u = await prisma.user.findFirst({
      where: { id: assigneeId, organizationId: actor.organization.id },
      select: { id: true },
    });
    if (!u) return NextResponse.json({ error: 'المسؤول غير موجود.' }, { status: 400 });
  }
  // عزل: الوحدة (إن وُجدت) يجب أن تكون ضمن نفس المؤسسة
  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, organizationId: actor.organization.id },
      select: { id: true },
    });
    if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }

  const dueDate = parseDate(body.dueDate);
  if (dueDate === undefined) {
    return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      dueDate,
      assigneeId,
      departmentId,
      organizationId: actor.organization.id, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: task.id });
}

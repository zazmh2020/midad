import { NextResponse } from 'next/server';
import type { ProgramCategory, ProgramStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManagePrograms, isProgramCategory, isProgramStatus } from '@/lib/permissions';

function parseCapacity(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

async function loadOwn(orgId: string, id: string) {
  // عزل: البرنامج يجب أن يكون ضمن مؤسسة الفاعل
  return prisma.program.findFirst({ where: { id, organizationId: orgId } });
}

/** تعديل برنامج */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManagePrograms(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await loadOwn(orgId, id);
  if (!target) {
    return NextResponse.json({ error: 'البرنامج غير موجود.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    name?: string;
    description?: string | null;
    category?: ProgramCategory;
    status?: ProgramStatus;
    capacity?: number | null;
    departmentId?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return NextResponse.json({ error: 'اسم البرنامج قصير جداً.' }, { status: 400 });
    }
    data.name = name;
  }

  if (body.description !== undefined) {
    data.description = String(body.description).trim() || null;
  }

  if (body.category !== undefined) {
    const category = String(body.category);
    if (!isProgramCategory(category)) {
      return NextResponse.json({ error: 'التصنيف غير صالح.' }, { status: 400 });
    }
    data.category = category;
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isProgramStatus(status)) {
      return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    }
    data.status = status;
  }

  if (body.capacity !== undefined) {
    const capacity = parseCapacity(body.capacity);
    if (capacity === undefined) {
      return NextResponse.json({ error: 'السعة يجب أن تكون رقمًا صحيحًا موجبًا.' }, { status: 400 });
    }
    data.capacity = capacity;
  }

  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: orgId },
        select: { id: true },
      });
      if (!dept) {
        return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
      }
    }
    data.departmentId = departmentId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  await prisma.program.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

/** حذف برنامج */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManagePrograms(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await loadOwn(orgId, id);
  if (!target) {
    return NextResponse.json({ error: 'البرنامج غير موجود.' }, { status: 404 });
  }

  await prisma.program.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

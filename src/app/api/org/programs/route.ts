import { NextResponse } from 'next/server';
import type { ProgramCategory, ProgramStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManagePrograms, isProgramCategory, isProgramStatus } from '@/lib/permissions';

/** يحوّل قيمة السعة إلى عدد موجب أو null، أو undefined إن كانت غير صالحة */
function parseCapacity(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

/** إنشاء برنامج داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManagePrograms(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const category = String(body.category ?? 'EDUCATIONAL');
  const status = String(body.status ?? 'ACTIVE');
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) {
    return NextResponse.json({ error: 'اسم البرنامج قصير جداً.' }, { status: 400 });
  }
  if (!isProgramCategory(category)) {
    return NextResponse.json({ error: 'التصنيف غير صالح.' }, { status: 400 });
  }
  if (!isProgramStatus(status)) {
    return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
  }

  const capacity = parseCapacity(body.capacity);
  if (capacity === undefined) {
    return NextResponse.json({ error: 'السعة يجب أن تكون رقمًا صحيحًا موجبًا.' }, { status: 400 });
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, organizationId: actor.organization.id },
      select: { id: true },
    });
    if (!dept) {
      return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
  }

  const program = await prisma.program.create({
    data: {
      name,
      description: description || null,
      category: category as ProgramCategory,
      status: status as ProgramStatus,
      capacity,
      departmentId,
      organizationId: actor.organization.id, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: program.id });
}

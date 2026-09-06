import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageStructure } from '@/lib/permissions';

/** إنشاء وحدة تنظيمية داخل مؤسسة الفاعل (إدارة/قسم/فرع) */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageStructure(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const parentId = body.parentId ? String(body.parentId) : null;

  if (name.length < 2) {
    return NextResponse.json({ error: 'اسم الوحدة قصير جداً.' }, { status: 400 });
  }

  // عزل: الأصل (إن وُجد) يجب أن يكون ضمن نفس المؤسسة
  if (parentId) {
    const parent = await prisma.department.findFirst({
      where: { id: parentId, organizationId: actor.organization.id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: 'الوحدة الأصل غير موجودة.' }, { status: 400 });
    }
  }

  const dept = await prisma.department.create({
    data: {
      name,
      description: description || null,
      parentId,
      organizationId: actor.organization.id, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: dept.id });
}

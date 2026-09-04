import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageStructure } from '@/lib/permissions';

/**
 * يتحقق أن candidateParent ليس هو الوحدة نفسها ولا أحد فروعها،
 * منعًا لإنشاء حلقة في الشجرة. يعتمد على قائمة مسطّحة لوحدات المؤسسة.
 */
function wouldCreateCycle(
  nodeId: string,
  candidateParentId: string,
  all: { id: string; parentId: string | null }[],
): boolean {
  if (candidateParentId === nodeId) return true;
  const byId = new Map(all.map((d) => [d.id, d.parentId]));
  let cursor: string | null | undefined = candidateParentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === nodeId) return true; // الأصل المرشّح يقع تحت العقدة
    if (seen.has(cursor)) break; // حماية إضافية
    seen.add(cursor);
    cursor = byId.get(cursor);
  }
  return false;
}

/** تعديل وحدة تنظيمية (اسم، وصف، نقلها تحت أصل آخر) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageStructure(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const orgId = actor.organization.id;
  const { id } = await params;

  const target = await prisma.department.findFirst({
    where: { id, organizationId: orgId }, // عزل
  });
  if (!target) {
    return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { name?: string; description?: string | null; parentId?: string | null } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return NextResponse.json({ error: 'اسم الوحدة قصير جداً.' }, { status: 400 });
    }
    data.name = name;
  }

  if (body.description !== undefined) {
    const description = String(body.description).trim();
    data.description = description || null;
  }

  if (body.parentId !== undefined) {
    const parentId = body.parentId ? String(body.parentId) : null;
    if (parentId) {
      const parent = await prisma.department.findFirst({
        where: { id: parentId, organizationId: orgId }, // عزل
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json({ error: 'الوحدة الأصل غير موجودة.' }, { status: 400 });
      }
      const all = await prisma.department.findMany({
        where: { organizationId: orgId },
        select: { id: true, parentId: true },
      });
      if (wouldCreateCycle(target.id, parentId, all)) {
        return NextResponse.json(
          { error: 'لا يمكن جعل الوحدة تابعة لأحد فروعها.' },
          { status: 400 },
        );
      }
    }
    data.parentId = parentId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  await prisma.department.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

/** حذف وحدة — يُرفض إن كان لها فروع أو أعضاء، لتفادي حذف غير مقصود */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageStructure(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const orgId = actor.organization.id;
  const { id } = await params;

  const target = await prisma.department.findFirst({
    where: { id, organizationId: orgId }, // عزل
    include: { _count: { select: { children: true, members: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 404 });
  }

  if (target._count.children > 0) {
    return NextResponse.json(
      { error: 'احذف أو انقل الوحدات الفرعية أولاً.' },
      { status: 400 },
    );
  }
  if (target._count.members > 0) {
    return NextResponse.json(
      { error: 'أزل أعضاء الوحدة أولاً.' },
      { status: 400 },
    );
  }

  await prisma.department.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

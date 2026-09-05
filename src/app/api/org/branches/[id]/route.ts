import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageBranches } from '@/lib/permissions';

async function loadOwn(actorOrgId: string, id: string) {
  // عزل: الفرع يجب أن يكون ضمن مؤسسة الفاعل
  return prisma.branch.findFirst({ where: { id, organizationId: actorOrgId } });
}

/** تعديل فرع */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageBranches(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الفرع غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الفرع قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  for (const f of ['code', 'city', 'address', 'phone', 'manager'] as const) {
    if (body[f] !== undefined) data[f] = String(body[f]).trim() || null;
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  await prisma.branch.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

/** حذف فرع */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageBranches(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الفرع غير موجود.' }, { status: 404 });

  await prisma.branch.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

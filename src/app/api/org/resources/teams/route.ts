import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageHR } from '@/lib/permissions';

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const lead = String(body.lead ?? '').trim();
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الفريق قصير جداً.' }, { status: 400 });
  if (departmentId) {
    const d = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
    if (!d) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }

  const t = await prisma.team.create({
    data: { name, description: description || null, lead: lead || null, departmentId, organizationId: orgId },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: t.id });
}

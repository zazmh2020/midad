import { NextResponse } from 'next/server';
import type { EmployeeStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageHR, isEmployeeStatus } from '@/lib/permissions';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}
async function own(orgId: string, id: string) {
  return prisma.employee.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await own(orgId, id);
  if (!target) return NextResponse.json({ error: 'الموظف غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    name?: string; phone?: string | null; email?: string | null; position?: string | null;
    hireDate?: Date | null; status?: EmployeeStatus; departmentId?: string | null;
  } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الموظف قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
  if (body.email !== undefined) data.email = String(body.email).trim() || null;
  if (body.position !== undefined) data.position = String(body.position).trim() || null;
  if (body.hireDate !== undefined) {
    const d = parseDate(body.hireDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ التعيين غير صالح.' }, { status: 400 });
    data.hireDate = d;
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isEmployeeStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    data.status = status;
  }
  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      const d = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
      if (!d) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
    data.departmentId = departmentId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.employee.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الموظف غير موجود.' }, { status: 404 });
  await prisma.employee.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

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

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageHR(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const email = String(body.email ?? '').trim();
  const position = String(body.position ?? '').trim();
  const status = String(body.status ?? 'ACTIVE');
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الموظف قصير جداً.' }, { status: 400 });
  if (!isEmployeeStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });

  const hireDate = parseDate(body.hireDate);
  if (hireDate === undefined) return NextResponse.json({ error: 'تاريخ التعيين غير صالح.' }, { status: 400 });

  if (departmentId) {
    const d = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
    if (!d) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }

  const e = await prisma.employee.create({
    data: {
      name, phone: phone || null, email: email || null, position: position || null,
      hireDate, status: status as EmployeeStatus, departmentId, organizationId: orgId,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: e.id });
}

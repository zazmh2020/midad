import { NextResponse } from 'next/server';
import type { StudentStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isStudentStatus } from '@/lib/permissions';

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}
async function own(orgId: string, id: string) {
  return prisma.student.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await own(orgId, id);
  if (!target) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    name?: string; phone?: string | null; guardianName?: string | null; guardianPhone?: string | null; guardianEmail?: string | null;
    birthDate?: Date | null; status?: StudentStatus; halaqaId?: string | null;
  } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الطالب قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
  if (body.guardianName !== undefined) data.guardianName = String(body.guardianName).trim() || null;
  if (body.guardianPhone !== undefined) data.guardianPhone = String(body.guardianPhone).trim() || null;
  if (body.guardianEmail !== undefined) data.guardianEmail = String(body.guardianEmail).trim() || null;
  if (body.birthDate !== undefined) {
    const d = parseDate(body.birthDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ الميلاد غير صالح.' }, { status: 400 });
    data.birthDate = d;
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isStudentStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    data.status = status;
  }
  if (body.halaqaId !== undefined) {
    const halaqaId = body.halaqaId ? String(body.halaqaId) : null;
    if (halaqaId) {
      const h = await prisma.halaqa.findFirst({ where: { id: halaqaId, organizationId: orgId }, select: { id: true } });
      if (!h) return NextResponse.json({ error: 'الحلقة غير موجودة.' }, { status: 400 });
    }
    data.halaqaId = halaqaId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.student.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const target = await own(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 });

  await prisma.student.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

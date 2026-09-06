import { NextResponse } from 'next/server';
import type { AttendanceStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isAttendanceStatus } from '@/lib/permissions';

/** يقرأ حضور حلقة في تاريخ محدّد (لتعبئة الكشف) */
export async function GET(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const url = new URL(request.url);
  const halaqaId = url.searchParams.get('halaqaId') ?? '';
  const dateStr = url.searchParams.get('date') ?? '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'التاريخ غير صالح.' }, { status: 400 });

  const halaqa = await prisma.halaqa.findFirst({ where: { id: halaqaId, organizationId: orgId }, select: { id: true } });
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة.' }, { status: 404 });

  const records = await prisma.attendanceRecord.findMany({
    where: { halaqaId, date, organizationId: orgId },
    select: { studentId: true, status: true },
  });
  return NextResponse.json({ ok: true, records });
}

/** يحفظ حضور حلقة في تاريخ محدّد — يحدّث الموجود ويضيف الجديد */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const halaqaId = String(body.halaqaId ?? '');
  const dateStr = String(body.date ?? '');
  const records = Array.isArray(body.records) ? body.records : null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'التاريخ غير صالح.' }, { status: 400 });
  if (!records || records.length === 0) return NextResponse.json({ error: 'لا سجلات.' }, { status: 400 });

  // عزل: الحلقة من نفس المؤسسة، مع طلابها المسموح بهم
  const halaqa = await prisma.halaqa.findFirst({
    where: { id: halaqaId, organizationId: orgId },
    select: { id: true, students: { select: { id: true } } },
  });
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة.' }, { status: 400 });
  const allowed = new Set(halaqa.students.map((s) => s.id));

  const ops = [];
  for (const rec of records) {
    const studentId = String(rec?.studentId ?? '');
    const status = String(rec?.status ?? 'PRESENT');
    if (!allowed.has(studentId)) {
      return NextResponse.json({ error: 'طالب لا ينتمي لهذه الحلقة.' }, { status: 400 });
    }
    if (!isAttendanceStatus(status)) {
      return NextResponse.json({ error: 'حالة حضور غير صالحة.' }, { status: 400 });
    }
    ops.push(
      prisma.attendanceRecord.upsert({
        where: { halaqaId_studentId_date: { halaqaId, studentId, date } },
        update: { status: status as AttendanceStatus },
        create: { halaqaId, studentId, date, status: status as AttendanceStatus, organizationId: orgId },
      }),
    );
  }

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true, count: ops.length });
}

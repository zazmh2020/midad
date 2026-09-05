import { NextResponse } from 'next/server';
import type { AttendanceStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isAttendanceStatus } from '@/lib/permissions';

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function floatOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function strOrNull(v: unknown): string | null {
  const s = String(v ?? '').trim();
  return s || null;
}

/** إنشاء/تحديث سجل يوم واحد لطالب (upsert بمفتاح studentId+date). */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const studentId = String(body.studentId ?? '');
  const dateStr = String(body.date ?? ''); // yyyy-mm-dd
  if (!studentId || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'بيانات ناقصة.' }, { status: 400 });
  }
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
  }

  // عزل: الطالب يجب أن يكون ضمن مؤسسة الفاعل
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId: actor.organization.id },
    select: { id: true, halaqaId: true },
  });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 });

  const attendance = String(body.attendance ?? 'PRESENT');
  if (!isAttendanceStatus(attendance)) {
    return NextResponse.json({ error: 'حالة الحضور غير صالحة.' }, { status: 400 });
  }

  const fields = {
    attendance: attendance as AttendanceStatus,
    newFrom: intOrNull(body.newFrom),
    newTo: intOrNull(body.newTo),
    newNote: strOrNull(body.newNote),
    reviewFrom: intOrNull(body.reviewFrom),
    reviewTo: intOrNull(body.reviewTo),
    last5From: intOrNull(body.last5From),
    last5To: intOrNull(body.last5To),
    listener: strOrNull(body.listener),
    pages: floatOrNull(body.pages),
    errors: intOrNull(body.errors),
    alerts: intOrNull(body.alerts),
    reviewScore: intOrNull(body.reviewScore),
    conductScore: intOrNull(body.conductScore),
    notes: strOrNull(body.notes),
    halaqaId: student.halaqaId,
  };

  await prisma.quranDailyRecord.upsert({
    where: { studentId_date: { studentId, date } },
    create: { studentId, date, organizationId: actor.organization.id, ...fields },
    update: fields,
  });

  return NextResponse.json({ ok: true });
}

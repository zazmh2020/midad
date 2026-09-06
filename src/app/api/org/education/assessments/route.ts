import { NextResponse } from 'next/server';
import type { AssessmentKind } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isAssessmentKind, computeAssessmentResult } from '@/lib/permissions';

function parseDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return new Date();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** يحوّل قيمة إلى رقم غير سالب أو null، ويعيد undefined إن كانت غير صالحة */
function parseNum(value: unknown, fallback: number | null): number | null | undefined {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** تسجيل تقييم/اختبار لطالب */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const studentId = String(body.studentId ?? '');
  const title = String(body.title ?? '').trim();
  const kind = String(body.kind ?? 'MEMORIZATION_TEST');
  const notes = String(body.notes ?? '').trim();

  if (title.length < 2) return NextResponse.json({ error: 'عنوان الاختبار قصير جداً.' }, { status: 400 });
  if (!isAssessmentKind(kind)) return NextResponse.json({ error: 'نوع الاختبار غير صالح.' }, { status: 400 });

  const maxScore = parseNum(body.maxScore, 100);
  if (maxScore === undefined || maxScore === null || maxScore <= 0) {
    return NextResponse.json({ error: 'الدرجة القصوى غير صالحة.' }, { status: 400 });
  }
  const score = parseNum(body.score, null);
  if (score === undefined) return NextResponse.json({ error: 'الدرجة غير صالحة.' }, { status: 400 });
  if (score !== null && score > maxScore) return NextResponse.json({ error: 'الدرجة أكبر من القصوى.' }, { status: 400 });

  const date = parseDate(body.date);
  if (date === undefined) return NextResponse.json({ error: 'التاريخ غير صالح.' }, { status: 400 });

  // عزل: الطالب من نفس المؤسسة
  const student = await prisma.student.findFirst({ where: { id: studentId, organizationId: orgId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 400 });

  const a = await prisma.assessment.create({
    data: {
      studentId, title, kind: kind as AssessmentKind,
      score, maxScore, result: computeAssessmentResult(score, maxScore),
      notes: notes || null, date, organizationId: orgId,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: a.id });
}

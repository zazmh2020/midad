import { NextResponse } from 'next/server';
import type { MemorizationKind, MemorizationRating } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation, isMemoKind, isMemoRating } from '@/lib/permissions';

function parseDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return new Date();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const studentId = String(body.studentId ?? '');
  const content = String(body.content ?? '').trim();
  const notes = String(body.notes ?? '').trim();
  const kind = String(body.kind ?? 'NEW');
  const rating = String(body.rating ?? 'GOOD');

  if (content.length < 1) return NextResponse.json({ error: 'المقطع مطلوب.' }, { status: 400 });
  if (!isMemoKind(kind)) return NextResponse.json({ error: 'النوع غير صالح.' }, { status: 400 });
  if (!isMemoRating(rating)) return NextResponse.json({ error: 'التقدير غير صالح.' }, { status: 400 });

  const date = parseDate(body.date);
  if (date === undefined) return NextResponse.json({ error: 'التاريخ غير صالح.' }, { status: 400 });

  // عزل: الطالب من نفس المؤسسة
  const student = await prisma.student.findFirst({ where: { id: studentId, organizationId: orgId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 400 });

  const m = await prisma.memorizationEntry.create({
    data: {
      studentId, content, notes: notes || null,
      kind: kind as MemorizationKind, rating: rating as MemorizationRating,
      date, organizationId: orgId,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: m.id });
}

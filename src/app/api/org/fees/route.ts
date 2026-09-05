import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageFees } from '@/lib/permissions';

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageFees(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const title = String(body.title ?? '').trim();
  const amount = Math.trunc(Number(body.amount));
  const studentId = String(body.studentId ?? '');
  const dueDate = parseDate(body.dueDate);
  if (title.length < 2) return NextResponse.json({ error: 'عنوان الرسم قصير جداً.' }, { status: 400 });
  if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: 'المبلغ غير صالح.' }, { status: 400 });

  const student = await prisma.student.findFirst({ where: { id: studentId, organizationId: orgId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 400 });

  const fee = await prisma.studentFee.create({
    data: { title, amount, dueDate, studentId, organizationId: orgId },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: fee.id });
}

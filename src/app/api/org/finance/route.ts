import { NextResponse } from 'next/server';
import type { FinanceKind, FinanceCategory } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageFinance, isFinanceKind, isFinanceCategory } from '@/lib/permissions';

function parseDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return new Date();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** تسجيل حركة مالية (دخل/مصروف) ضمن مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageFinance(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const kind = String(body.kind ?? '');
  if (!isFinanceKind(kind)) return NextResponse.json({ error: 'نوع الحركة غير صالح.' }, { status: 400 });

  const category = String(body.category ?? 'OTHER');
  if (!isFinanceCategory(category)) return NextResponse.json({ error: 'التصنيف غير صالح.' }, { status: 400 });

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'المبلغ غير صالح.' }, { status: 400 });
  }

  const date = parseDate(body.date);
  if (date === undefined) return NextResponse.json({ error: 'التاريخ غير صالح.' }, { status: 400 });

  const tx = await prisma.financeTransaction.create({
    data: {
      kind: kind as FinanceKind,
      category: category as FinanceCategory,
      amount,
      date,
      description: String(body.description ?? '').trim() || null,
      organizationId: actor.organization.id, // عزل
      createdById: actor.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: tx.id });
}

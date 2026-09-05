import { NextResponse } from 'next/server';
import type { ApprovalCategory } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewApprovals, isApprovalCategory } from '@/lib/permissions';

/** يحوّل قيمة إلى مبلغ عشري صالح أو null، ويعيد undefined إن كانت غير صالحة */
function parseAmount(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** تقديم طلب اعتماد جديد — أي عضو في المؤسسة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canViewApprovals(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const title = String(body.title ?? '').trim();
  if (title.length < 2) return NextResponse.json({ error: 'عنوان الطلب قصير جداً.' }, { status: 400 });

  const category = String(body.category ?? 'GENERAL');
  if (!isApprovalCategory(category)) {
    return NextResponse.json({ error: 'التصنيف غير صالح.' }, { status: 400 });
  }

  const amount = parseAmount(body.amount);
  if (amount === undefined) return NextResponse.json({ error: 'المبلغ غير صالح.' }, { status: 400 });

  const approval = await prisma.approval.create({
    data: {
      title,
      description: String(body.description ?? '').trim() || null,
      category: category as ApprovalCategory,
      amount,
      organizationId: actor.organization.id, // عزل
      requestedById: actor.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: approval.id });
}

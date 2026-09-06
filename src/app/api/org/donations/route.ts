import { NextResponse } from 'next/server';
import type { DonationMethod, DonationStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageDonations, isDonationMethod, isDonationStatus } from '@/lib/permissions';

function parseDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return new Date();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** تسجيل تبرع داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageDonations(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const donorName = String(body.donorName ?? '').trim();
  const note = String(body.note ?? '').trim();
  const method = String(body.method ?? 'CASH');
  const status = String(body.status ?? 'RECEIVED');
  const campaignId = body.campaignId ? String(body.campaignId) : null;

  if (donorName.length < 2) return NextResponse.json({ error: 'اسم المتبرع قصير جداً.' }, { status: 400 });

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: 'المبلغ يجب أن يكون رقمًا صحيحًا موجبًا.' }, { status: 400 });
  }
  if (!isDonationMethod(method)) return NextResponse.json({ error: 'طريقة الدفع غير صالحة.' }, { status: 400 });
  if (!isDonationStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });

  const donatedAt = parseDate(body.donatedAt);
  if (donatedAt === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });

  if (campaignId) {
    const c = await prisma.campaign.findFirst({ where: { id: campaignId, organizationId: orgId }, select: { id: true } });
    if (!c) return NextResponse.json({ error: 'الحملة غير موجودة.' }, { status: 400 });
  }

  const d = await prisma.donation.create({
    data: {
      donorName,
      amount,
      method: method as DonationMethod,
      status: status as DonationStatus,
      note: note || null,
      donatedAt,
      campaignId,
      organizationId: orgId, // عزل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: d.id });
}

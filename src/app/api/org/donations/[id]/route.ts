import { NextResponse } from 'next/server';
import type { DonationMethod, DonationStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageDonations, isDonationMethod, isDonationStatus } from '@/lib/permissions';

async function loadOwn(orgId: string, id: string) {
  return prisma.donation.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageDonations(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await loadOwn(orgId, id);
  if (!target) return NextResponse.json({ error: 'التبرع غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    donorName?: string; amount?: number; method?: DonationMethod; status?: DonationStatus;
    note?: string | null; campaignId?: string | null;
  } = {};

  if (body.donorName !== undefined) {
    const donorName = String(body.donorName).trim();
    if (donorName.length < 2) return NextResponse.json({ error: 'اسم المتبرع قصير جداً.' }, { status: 400 });
    data.donorName = donorName;
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: 'المبلغ يجب أن يكون رقمًا صحيحًا موجبًا.' }, { status: 400 });
    data.amount = amount;
  }
  if (body.method !== undefined) {
    const method = String(body.method);
    if (!isDonationMethod(method)) return NextResponse.json({ error: 'طريقة الدفع غير صالحة.' }, { status: 400 });
    data.method = method;
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isDonationStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    data.status = status;
  }
  if (body.note !== undefined) data.note = String(body.note).trim() || null;
  if (body.campaignId !== undefined) {
    const campaignId = body.campaignId ? String(body.campaignId) : null;
    if (campaignId) {
      const c = await prisma.campaign.findFirst({ where: { id: campaignId, organizationId: orgId }, select: { id: true } });
      if (!c) return NextResponse.json({ error: 'الحملة غير موجودة.' }, { status: 400 });
    }
    data.campaignId = campaignId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });

  await prisma.donation.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageDonations(actor.role)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'التبرع غير موجود.' }, { status: 404 });

  await prisma.donation.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

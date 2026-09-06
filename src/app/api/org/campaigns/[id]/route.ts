import { NextResponse } from 'next/server';
import type { CampaignType, CampaignStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageCampaigns, isCampaignType, isCampaignStatus } from '@/lib/permissions';

function parseAmount(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}
function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function loadOwn(orgId: string, id: string) {
  return prisma.campaign.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageCampaigns(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await loadOwn(orgId, id);
  if (!target) return NextResponse.json({ error: 'الحملة غير موجودة.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    name?: string; description?: string | null; type?: CampaignType; status?: CampaignStatus;
    goalAmount?: number | null; startDate?: Date | null; endDate?: Date | null; departmentId?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الحملة قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.description !== undefined) data.description = String(body.description).trim() || null;
  if (body.type !== undefined) {
    const type = String(body.type);
    if (!isCampaignType(type)) return NextResponse.json({ error: 'النوع غير صالح.' }, { status: 400 });
    data.type = type;
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isCampaignStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    data.status = status;
  }
  if (body.goalAmount !== undefined) {
    const goalAmount = parseAmount(body.goalAmount);
    if (goalAmount === undefined) return NextResponse.json({ error: 'الهدف يجب أن يكون رقمًا صحيحًا موجبًا.' }, { status: 400 });
    data.goalAmount = goalAmount;
  }
  if (body.startDate !== undefined) {
    const d = parseDate(body.startDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
    data.startDate = d;
  }
  if (body.endDate !== undefined) {
    const d = parseDate(body.endDate);
    if (d === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
    data.endDate = d;
  }
  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
      if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
    data.departmentId = departmentId;
  }

  const start = data.startDate !== undefined ? data.startDate : target.startDate;
  const end = data.endDate !== undefined ? data.endDate : target.endDate;
  if (start && end && end < start) return NextResponse.json({ error: 'تاريخ النهاية قبل تاريخ البداية.' }, { status: 400 });

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });

  await prisma.campaign.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageCampaigns(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الحملة غير موجودة.' }, { status: 404 });

  await prisma.campaign.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

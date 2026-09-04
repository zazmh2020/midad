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

/** إنشاء حملة داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageCampaigns(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const type = String(body.type ?? 'CHARITY');
  const status = String(body.status ?? 'ACTIVE');
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الحملة قصير جداً.' }, { status: 400 });
  if (!isCampaignType(type)) return NextResponse.json({ error: 'النوع غير صالح.' }, { status: 400 });
  if (!isCampaignStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });

  const goalAmount = parseAmount(body.goalAmount);
  if (goalAmount === undefined) return NextResponse.json({ error: 'الهدف يجب أن يكون رقمًا صحيحًا موجبًا.' }, { status: 400 });

  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);
  if (startDate === undefined || endDate === undefined) return NextResponse.json({ error: 'تاريخ غير صالح.' }, { status: 400 });
  if (startDate && endDate && endDate < startDate) return NextResponse.json({ error: 'تاريخ النهاية قبل تاريخ البداية.' }, { status: 400 });

  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId: actor.organization.id }, select: { id: true } });
    if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      type: type as CampaignType,
      status: status as CampaignStatus,
      goalAmount,
      startDate,
      endDate,
      departmentId,
      organizationId: actor.organization.id, // عزل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: campaign.id });
}

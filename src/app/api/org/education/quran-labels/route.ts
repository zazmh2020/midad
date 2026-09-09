import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';
import { SUMMARY_LABELS } from '@/lib/quran-summary';

/** حفظ مسميات جدول نهاية الشهر المخصّصة للمركز — لمدير التعليم. */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = body?.labels;
  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }

  // نقبل فقط المفاتيح المعروفة، وحقلَي ar/en نصًّا محدودًا
  const clean: Record<string, { ar: string; en: string }> = {};
  for (const key of Object.keys(SUMMARY_LABELS)) {
    const v = (input as Record<string, { ar?: unknown; en?: unknown }>)[key];
    if (!v || typeof v !== 'object') continue;
    const ar = String(v.ar ?? '').trim().slice(0, 120);
    const en = String(v.en ?? '').trim().slice(0, 120);
    if (ar || en) clean[key] = { ar, en };
  }

  await prisma.organization.update({
    where: { id: actor.organization.id },
    data: { quranSummaryLabels: Object.keys(clean).length ? clean : Prisma.DbNull },
  });
  return NextResponse.json({ ok: true });
}

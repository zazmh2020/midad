import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';

/** تخصيص الهوية البصرية للجهة — مدير الجهة فقط. */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { brandColor?: string | null; logoUrl?: string | null } = {};

  if (body.brandColor !== undefined) {
    const c = String(body.brandColor ?? '').trim();
    if (c === '') data.brandColor = null;
    else if (/^#?[0-9a-fA-F]{6}$/.test(c)) data.brandColor = c.startsWith('#') ? c : `#${c}`;
    else return NextResponse.json({ error: 'لون غير صالح (استخدم صيغة #RRGGBB).' }, { status: 400 });
  }
  if (body.logoUrl !== undefined) {
    const u = String(body.logoUrl ?? '').trim();
    if (u === '') data.logoUrl = null;
    else if (/^https?:\/\/.+/i.test(u) && u.length <= 2048) data.logoUrl = u;
    else return NextResponse.json({ error: 'رابط شعار غير صالح (يبدأ بـ http).' }, { status: 400 });
  }

  await prisma.organization.update({ where: { id: actor.organizationId! }, data });
  return NextResponse.json({ ok: true });
}

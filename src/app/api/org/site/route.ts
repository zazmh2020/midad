import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';

/** نشر/إلغاء نشر الموقع العام للمؤسسة — مدير المؤسسة فقط. */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    sitePublished?: boolean; aboutText?: string | null;
    contactEmail?: string | null; contactPhone?: string | null; address?: string | null;
  } = {};
  if (typeof body.published === 'boolean') data.sitePublished = body.published;
  if (body.aboutText !== undefined) data.aboutText = String(body.aboutText).trim() || null;
  if (body.contactEmail !== undefined) data.contactEmail = String(body.contactEmail).trim() || null;
  if (body.contactPhone !== undefined) data.contactPhone = String(body.contactPhone).trim() || null;
  if (body.address !== undefined) data.address = String(body.address).trim() || null;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  await prisma.organization.update({ where: { id: actor.organization.id }, data });
  return NextResponse.json({ ok: true });
}

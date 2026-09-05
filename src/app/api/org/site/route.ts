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
  if (!body || typeof body.published !== 'boolean') {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }
  await prisma.organization.update({
    where: { id: actor.organization.id },
    data: { sitePublished: body.published },
  });
  return NextResponse.json({ ok: true, published: body.published });
}

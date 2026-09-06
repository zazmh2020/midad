import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';

/** إنشاء خبر/إعلان */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? '').trim();
  const text = String(body?.body ?? '').trim();
  if (title.length < 2) return NextResponse.json({ error: 'عنوان قصير جداً.' }, { status: 400 });
  if (text.length < 2) return NextResponse.json({ error: 'المحتوى قصير جداً.' }, { status: 400 });

  await prisma.announcement.create({
    data: { title, body: text, organizationId: actor.organizationId! },
  });
  return NextResponse.json({ ok: true });
}

/** حذف خبر */
export async function DELETE(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'مُعرّف مفقود.' }, { status: 400 });
  await prisma.announcement.deleteMany({ where: { id, organizationId: actor.organizationId! } });
  return NextResponse.json({ ok: true });
}

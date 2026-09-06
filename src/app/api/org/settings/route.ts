import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';

/** تعديل بيانات المؤسسة العامة (الاسم) — على مؤسسة الفاعل حصراً */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ error: 'اسم المؤسسة قصير جداً.' }, { status: 400 });
  }

  await prisma.organization.update({
    where: { id: actor.organizationId! },
    data: { name },
  });

  return NextResponse.json({ ok: true });
}

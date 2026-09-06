import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageBranches } from '@/lib/permissions';

/** إنشاء فرع داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageBranches(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ error: 'اسم الفرع قصير جداً.' }, { status: 400 });
  }

  const branch = await prisma.branch.create({
    data: {
      name,
      code: String(body.code ?? '').trim() || null,
      city: String(body.city ?? '').trim() || null,
      address: String(body.address ?? '').trim() || null,
      phone: String(body.phone ?? '').trim() || null,
      manager: String(body.manager ?? '').trim() || null,
      isActive: body.isActive === false ? false : true,
      organizationId: actor.organization.id, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: branch.id });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageUsers, ALL_CAPS } from '@/lib/permissions';

/** يُبقي فقط القدرات المعروفة (يمنع حقن مفاتيح غير صالحة). */
function sanitizeCaps(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const set = new Set(ALL_CAPS);
  return [...new Set(input.map((x) => String(x)).filter((c) => set.has(c)))];
}

/** إنشاء دور مخصّص داخل مؤسسة الفاعل */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageUsers(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  if (name.length < 2) return NextResponse.json({ error: 'اسم الدور قصير جداً.' }, { status: 400 });

  const role = await prisma.customRole.create({
    data: {
      name,
      permissions: sanitizeCaps(body.permissions),
      organizationId: actor.organization.id, // عزل
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: role.id });
}

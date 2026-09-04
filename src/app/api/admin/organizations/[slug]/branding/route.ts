import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/** تخصيص الهوية البصرية لمؤسسة — لمالك المنصة فقط. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { brandColor?: string | null; logoUrl?: string | null } = {};
  if (body.brandColor !== undefined) {
    const c = String(body.brandColor ?? '').trim();
    if (c === '') data.brandColor = null;
    else if (/^#?[0-9a-fA-F]{6}$/.test(c)) data.brandColor = c.startsWith('#') ? c : `#${c}`;
    else return NextResponse.json({ error: 'لون غير صالح (#RRGGBB).' }, { status: 400 });
  }
  if (body.logoUrl !== undefined) {
    const u = String(body.logoUrl ?? '').trim();
    if (u === '') data.logoUrl = null;
    else if (/^https?:\/\/.+/i.test(u) && u.length <= 2048) data.logoUrl = u;
    else return NextResponse.json({ error: 'رابط شعار غير صالح.' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
  if (!org) return NextResponse.json({ error: 'المؤسسة غير موجودة.' }, { status: 404 });

  await prisma.organization.update({ where: { id: org.id }, data });
  return NextResponse.json({ ok: true });
}

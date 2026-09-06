import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEvents } from '@/lib/permissions';

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEvents(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const title = String(body.title ?? '').trim();
  const details = String(body.details ?? '').trim();
  const location = String(body.location ?? '').trim();
  const startAt = parseDate(body.startAt);
  const endAt = parseDate(body.endAt);
  if (title.length < 2) return NextResponse.json({ error: 'عنوان الفعالية قصير جداً.' }, { status: 400 });
  if (!startAt) return NextResponse.json({ error: 'تاريخ البداية مطلوب.' }, { status: 400 });
  if (endAt && endAt < startAt) return NextResponse.json({ error: 'تاريخ النهاية قبل البداية.' }, { status: 400 });

  const ev = await prisma.event.create({
    data: { title, details: details || null, location: location || null, startAt, endAt, organizationId: actor.organization.id },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: ev.id });
}

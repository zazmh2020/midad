import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewProjects } from '@/lib/permissions';

const STATUSES = ['UPCOMING', 'OPEN', 'CLOSED'];

/** إنشاء مسابقة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canViewProjects(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? '').trim();
  if (name.length < 2) return NextResponse.json({ error: 'اسم المسابقة قصير جداً.' }, { status: 400 });

  const level = body?.level ? String(body.level).trim() : null;
  const status = STATUSES.includes(body?.status) ? body.status : 'UPCOMING';
  const startDate = body?.startDate ? new Date(String(body.startDate)) : null;

  await prisma.competition.create({
    data: { name, level, status, startDate, organizationId: actor.organizationId! },
  });
  return NextResponse.json({ ok: true });
}

/** حذف مسابقة */
export async function DELETE(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canViewProjects(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'مُعرّف مفقود.' }, { status: 400 });

  // عزل: احذف فقط ضمن مؤسسة الفاعل
  await prisma.competition.deleteMany({ where: { id, organizationId: actor.organizationId! } });
  return NextResponse.json({ ok: true });
}

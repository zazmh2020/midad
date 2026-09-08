import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

type Stage = { t: string; d: string; meta: string };

function cleanStages(input: unknown): Stage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((s) => ({
      t: String((s as Stage)?.t ?? '').trim().slice(0, 120),
      d: String((s as Stage)?.d ?? '').trim().slice(0, 200),
      meta: String((s as Stage)?.meta ?? '').trim().slice(0, 60),
    }))
    .filter((s) => s.t.length > 0)
    .slice(0, 20);
}

/** إنشاء خطة/مقرّر مخصّص */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? '').trim();
  if (title.length < 2) return NextResponse.json({ error: 'اسم الخطة قصير جداً.' }, { status: 400 });

  const stages = cleanStages(body?.stages);

  const plan = await prisma.studyPlan.create({
    data: {
      title,
      subtitle: body?.subtitle ? String(body.subtitle).trim().slice(0, 160) : null,
      description: body?.description ? String(body.description).trim().slice(0, 600) : null,
      tag: body?.tag ? String(body.tag).trim().slice(0, 40) : null,
      stages,
      organizationId: actor.organization.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: plan.id });
}

/** حذف خطة مخصّصة */
export async function DELETE(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'مُعرّف مفقود.' }, { status: 400 });

  await prisma.studyPlan.deleteMany({ where: { id, organizationId: actor.organization.id } });
  return NextResponse.json({ ok: true });
}

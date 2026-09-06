import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageKnowledge } from '@/lib/permissions';

async function loadOwn(orgId: string, id: string) {
  return prisma.knowledgeArticle.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageKnowledge(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'المقالة غير موجودة.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { title?: string; body?: string; category?: string | null; isPublished?: boolean } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2) return NextResponse.json({ error: 'العنوان قصير جداً.' }, { status: 400 });
    data.title = title;
  }
  if (body.body !== undefined) {
    const content = String(body.body).trim();
    if (content.length < 2) return NextResponse.json({ error: 'المحتوى قصير جداً.' }, { status: 400 });
    data.body = content;
  }
  if (body.category !== undefined) data.category = String(body.category).trim() || null;
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });

  await prisma.knowledgeArticle.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageKnowledge(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'المقالة غير موجودة.' }, { status: 404 });

  await prisma.knowledgeArticle.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageKnowledge } from '@/lib/permissions';

/** إنشاء مقالة في قاعدة المعرفة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageKnowledge(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const title = String(body.title ?? '').trim();
  const content = String(body.body ?? '').trim();
  const category = String(body.category ?? '').trim();
  const isPublished = body.isPublished === true;

  if (title.length < 2) return NextResponse.json({ error: 'العنوان قصير جداً.' }, { status: 400 });
  if (content.length < 2) return NextResponse.json({ error: 'المحتوى قصير جداً.' }, { status: 400 });

  const article = await prisma.knowledgeArticle.create({
    data: {
      title,
      body: content,
      category: category || null,
      isPublished,
      authorId: actor.id,
      organizationId: actor.organization.id, // عزل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: article.id });
}

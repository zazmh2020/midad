import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageDocuments } from '@/lib/permissions';
import { orgObjectPrefix } from '@/lib/s3';

const MAX_SIZE = 25 * 1024 * 1024;

/** يسجّل البيانات الوصفية لوثيقة رُفعت للتوّ إلى المخزن */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageDocuments(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const category = String(body.category ?? '').trim();
  const fileKey = String(body.key ?? '');
  const fileName = String(body.fileName ?? '').trim();
  const contentType = String(body.contentType ?? 'application/octet-stream');
  const size = Number(body.size);
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الوثيقة قصير جداً.' }, { status: 400 });
  if (!fileName) return NextResponse.json({ error: 'اسم الملف مطلوب.' }, { status: 400 });
  if (!Number.isInteger(size) || size <= 0 || size > MAX_SIZE) {
    return NextResponse.json({ error: 'حجم الملف غير صالح.' }, { status: 400 });
  }

  // عزل: المفتاح يجب أن يقع تحت بادئة هذه المؤسسة، وأن يكون جديدًا
  if (!fileKey.startsWith(orgObjectPrefix(orgId))) {
    return NextResponse.json({ error: 'مفتاح الملف غير صالح.' }, { status: 400 });
  }
  const exists = await prisma.document.findUnique({ where: { fileKey }, select: { id: true } });
  if (exists) return NextResponse.json({ error: 'الملف مسجّل بالفعل.' }, { status: 409 });

  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
    if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      name,
      description: description || null,
      category: category || null,
      fileKey,
      fileName,
      contentType,
      size,
      departmentId,
      uploadedById: actor.id,
      organizationId: orgId, // عزل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: doc.id });
}

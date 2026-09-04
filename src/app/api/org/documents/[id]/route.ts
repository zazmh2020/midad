import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageDocuments } from '@/lib/permissions';
import { isS3Configured, deleteObject } from '@/lib/s3';

/** حذف وثيقة: الكائن من المخزن ثم السجل */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageDocuments(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: { id, organizationId: actor.organization.id }, // عزل
  });
  if (!doc) return NextResponse.json({ error: 'الوثيقة غير موجودة.' }, { status: 404 });

  // نحاول حذف الكائن؛ لو فشل لا نُبقي سجلاً معلّقًا لكن ننبّه
  if (isS3Configured()) {
    try {
      await deleteObject(doc.fileKey);
    } catch {
      return NextResponse.json({ error: 'تعذّر حذف الملف من المخزن.' }, { status: 502 });
    }
  }

  await prisma.document.delete({ where: { id: doc.id } });
  return NextResponse.json({ ok: true });
}

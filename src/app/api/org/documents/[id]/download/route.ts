import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewDocuments } from '@/lib/permissions';
import { isS3Configured, presignDownload } from '@/lib/s3';

/** يعيد التوجيه إلى رابط تنزيل موقّع مؤقت — بعد التحقق من ملكية المؤسسة */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canViewDocuments(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  // عزل: الوثيقة يجب أن تكون ضمن مؤسسة الفاعل (قبل أي شيء آخر)
  const doc = await prisma.document.findFirst({
    where: { id, organizationId: actor.organization.id },
    select: { fileKey: true, fileName: true },
  });
  if (!doc) return NextResponse.json({ error: 'الوثيقة غير موجودة.' }, { status: 404 });

  if (!isS3Configured()) {
    return NextResponse.json({ error: 'التخزين غير مُعدّ.' }, { status: 503 });
  }

  try {
    const url = await presignDownload(doc.fileKey, doc.fileName);
    return NextResponse.redirect(url, 307);
  } catch {
    return NextResponse.json({ error: 'تعذّر تجهيز التنزيل.' }, { status: 502 });
  }
}

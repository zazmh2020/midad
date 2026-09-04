import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getOrgActor } from '@/lib/org';
import { canManageDocuments } from '@/lib/permissions';
import { isS3Configured, presignUpload, orgObjectPrefix } from '@/lib/s3';

const MAX_SIZE = 25 * 1024 * 1024; // 25 ميغابايت

/** يطلب رابط رفع موقّعًا؛ المفتاح معزول بالمؤسسة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageDocuments(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  if (!isS3Configured()) {
    return NextResponse.json({ error: 'التخزين غير مُعدّ. أضِف متغيّرات S3_* في .env' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const fileName = String(body.fileName ?? '').trim();
  const contentType = String(body.contentType ?? 'application/octet-stream');
  const size = Number(body.size);

  if (!fileName) return NextResponse.json({ error: 'اسم الملف مطلوب.' }, { status: 400 });
  if (!Number.isInteger(size) || size <= 0) {
    return NextResponse.json({ error: 'حجم الملف غير صالح.' }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: 'الحد الأقصى لحجم الملف 25 ميغابايت.' }, { status: 400 });
  }

  // اسم آمن + معرّف فريد، تحت بادئة المؤسسة
  const safeName = fileName.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(-120);
  const key = `${orgObjectPrefix(actor.organization.id)}${randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await presignUpload(key, contentType);
    return NextResponse.json({ ok: true, key, uploadUrl });
  } catch {
    return NextResponse.json({ error: 'تعذّر تجهيز الرفع.' }, { status: 502 });
  }
}

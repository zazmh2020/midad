import { NextResponse } from 'next/server';
import { reportError } from '@/lib/observe';

/** يستقبل بلاغ خطأ من حدود الأخطاء في المتصفّح ويسجّله على الخادم. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.message !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await reportError({
    message: body.message,
    stack: typeof body.stack === 'string' ? body.stack : undefined,
    where: typeof body.where === 'string' ? body.where : 'client',
    digest: typeof body.digest === 'string' ? body.digest : undefined,
  });
  return NextResponse.json({ ok: true });
}

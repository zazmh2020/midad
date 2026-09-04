import { NextResponse } from 'next/server';
import { destroySession, sessionCookieDomain } from '@/lib/session';

export async function POST(request: Request) {
  await destroySession(sessionCookieDomain(request.headers.get('host')));
  return NextResponse.json({ ok: true });
}

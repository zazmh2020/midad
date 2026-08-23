import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

/* ============================================================
   الجلسة — كوكي موقّعة تحمل هوية المستخدم
   التوقيع يمنع تزوير محتواها من جهة المتصفح.
   ============================================================ */

const COOKIE_NAME = 'midad_session';
const MAX_AGE_DAYS = 7;

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET غير معرّف في ملف .env');
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function serializeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return payload + '.' + sign(payload);
}

export function parseSession(token: string): SessionData | null {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sign(payload);

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(data: SessionData, remember: boolean) {
  const store = await cookies();
  store.set(COOKIE_NAME, serializeSession(data), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: remember ? MAX_AGE_DAYS * 24 * 60 * 60 : undefined,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? parseSession(token) : null;
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

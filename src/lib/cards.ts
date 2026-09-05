import 'server-only';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

/* ============================================================
   البطاقات الرقمية — رمز تحقّق فريد لكل عضو + توليد رمز QR (SVG).
   ============================================================ */

/** يولّد رمزًا عشوائيًا (32 خانة سداسية عشرية) للبطاقة. */
export function newCardToken(): string {
  return randomBytes(16).toString('hex');
}

/** يضمن وجود رمز بطاقة لكل مستخدم في القائمة، ويعيد خريطة id → token. */
export async function ensureCardTokens(
  users: { id: string; cardToken: string | null }[],
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const missing = users.filter((u) => !u.cardToken);
  for (const u of users) if (u.cardToken) map[u.id] = u.cardToken;
  // يُولّد للمفتقدين فقط (كتابة كسولة عند أول عرض)
  await Promise.all(
    missing.map(async (u) => {
      const token = newCardToken();
      await prisma.user.update({ where: { id: u.id }, data: { cardToken: token } });
      map[u.id] = token;
    }),
  );
  return map;
}

/** يعيد رمز QR كنصّ SVG جاهز للتضمين (بألوان الهوية). */
export async function qrSvg(text: string, color = '#2b1a4e'): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: color, light: '#00000000' }, // خلفية شفّافة
  });
}

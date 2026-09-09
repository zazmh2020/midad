const HTTP = /^https?:\/\/.+/i;
const DATA_IMG = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;
// حدّ حجم الصورة المرفوعة (data URI) — نحو 1.6MB بعد فكّ التشفير
const MAX_DATA = 2_200_000;

/**
 * يتحقّق من قيمة صورة الهوية: رابط http(s) أو صورة مرفوعة (data:image؛base64).
 * يعيد القيمة الصالحة، أو null للفارغة، ويرمي خطأً عند عدم الصلاحية.
 */
export function imageValue(value: unknown, label: string): string | null {
  const u = String(value ?? '').trim();
  if (u === '') return null;
  if (HTTP.test(u) && u.length <= 2048) return u;
  if (DATA_IMG.test(u) && u.length <= MAX_DATA) return u;
  throw new Error(`صورة ${label} غير صالحة.`);
}

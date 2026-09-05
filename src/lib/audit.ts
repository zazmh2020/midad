import { prisma } from '@/lib/prisma';

/** يسجّل إجراءً في سجلّ نشاط المؤسسة (لا يفشل الطلب إن تعذّر التسجيل). */
export async function logAudit(
  organizationId: string,
  actorName: string,
  action: string,
  entity: string,
  label?: string | null,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { organizationId, actorName, action, entity, label: label ?? null },
    });
  } catch {
    /* تجاهل — التسجيل ثانوي */
  }
}

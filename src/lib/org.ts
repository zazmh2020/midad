import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Organization, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/* ============================================================
   حارس المؤسسة — عزل المستأجرين (Tenant isolation)

   كل دومين فرعي يحمل جلسته الخاصة (كوكي مربوطة بالمضيف).
   نتحقق هنا من ثلاث طبقات:
     1) وجود جلسة صالحة على هذا الدومين.
     2) أن مؤسسة الجلسة تطابق الـ slug المطلوب.
     3) أن المستخدم ومؤسسته نشطان في قاعدة البيانات (لا نثق بالكوكي وحده).
   ============================================================ */

export type OrgContext = {
  user: User;
  org: Organization;
};

/** يقرأ سياق المؤسسة للطلب الحالي، أو null إن لم يكن مصرّحًا. مُخزّن لكل طلب. */
export const getOrgContext = cache(
  async (slug: string): Promise<OrgContext | null> => {
    const session = await getSession();
    if (!session) return null;

    // عزل: الجلسة يجب أن تخصّ نفس مؤسسة الدومين الفرعي
    if (session.organizationSlug !== slug) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) return null;
    if (!user.organization) return null;
    if (user.organization.slug !== slug || !user.organization.isActive) {
      return null;
    }

    const { organization, ...rest } = user;
    return { user: rest as User, org: organization };
  },
);

/** يفرض الوصول لمؤسسة الـ slug، ويحوّل لصفحة الدخول عند الفشل. */
export async function requireOrgAccess(slug: string): Promise<OrgContext> {
  const ctx = await getOrgContext(slug);
  if (!ctx) redirect('/login');
  return ctx;
}

/**
 * حارس واجهات الـ API داخل المؤسسة — يعتمد على الجلسة وحدها
 * (لا slug من المسار)، ويعيد المستخدم الفاعل بعد التحقق من نشاطه.
 */
export async function getOrgActor(): Promise<
  (User & { organization: Organization }) | null
> {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });

  if (!user || !user.isActive) return null;
  if (!user.organization || !user.organization.isActive) return null;

  return user as User & { organization: Organization };
}

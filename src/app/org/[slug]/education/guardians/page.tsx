import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageEducation } from '@/lib/permissions';
import GuardiansView from '@/components/education/GuardiansView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function GuardiansPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canManageEducation(user)) redirect(`/org/${org.slug}`);

  const [rows, students, linkable] = await Promise.all([
    prisma.guardian.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, fullName: true, phone: true, email: true,
        user: { select: { id: true, name: true } },
        students: { select: { id: true } },
      },
    }),
    prisma.student.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    // حسابات المؤسسة غير المرتبطة بوليّ أمر بعد — قابلة للربط
    prisma.user.findMany({
      where: { organizationId: org.id, isActive: true, guardianProfile: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('guardian.pageTitle')}</h1>
          <p>{t('guardian.pageSub', { n: rows.length, org: org.name })}</p>
        </div>
      </div>
      <GuardiansView
        students={students}
        linkableUsers={linkable}
        guardians={rows.map((g) => ({
          id: g.id, fullName: g.fullName, phone: g.phone, email: g.email,
          userId: g.user?.id ?? null, userName: g.user?.name ?? null,
          studentIds: g.students.map((s) => s.id),
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import TeachersView from '@/components/education/TeachersView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function TeachersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);

  const [teachers, users] = await Promise.all([
    prisma.teacher.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, phone: true, specialization: true, isActive: true, userId: true,
        _count: { select: { halaqat: true } },
      },
    }),
    prisma.user.findMany({ where: { organizationId: org.id, isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('pg.teachers.title')}</h1>
          <p>{t('pg.teachers.sub', { n: teachers.length, org: org.name })}</p>
        </div>
      </div>
      <TeachersView users={users} teachers={teachers.map((t) => ({
        id: t.id, name: t.name, phone: t.phone, specialization: t.specialization,
        isActive: t.isActive, userId: t.userId, halaqatCount: t._count.halaqat,
      }))} />
    </div>
  );
}

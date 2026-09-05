import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import HalaqatView from '@/components/education/HalaqatView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function HalaqatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);

  const [halaqat, teachers] = await Promise.all([
    prisma.halaqa.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, type: true, schedule: true, teacherId: true,
        teacher: { select: { name: true } }, _count: { select: { students: true } },
      },
    }),
    prisma.teacher.findMany({ where: { organizationId: org.id, isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('pg.halaqat.title')}</h1>
          <p>{t('pg.halaqat.sub', { n: halaqat.length, org: org.name })}</p>
        </div>
      </div>
      <HalaqatView
        teachers={teachers}
        halaqat={halaqat.map((h) => ({
          id: h.id, name: h.name, type: h.type, schedule: h.schedule, teacherId: h.teacherId,
          teacherName: h.teacher?.name ?? null, studentCount: h._count.students,
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import AttendanceView from '@/components/education/AttendanceView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);

  const halaqat = await prisma.halaqa.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true,
      students: { orderBy: { name: 'asc' }, select: { id: true, name: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('pg.attendance.title')}</h1>
          <p>{t('pg.attendance.sub')}</p>
        </div>
      </div>
      <AttendanceView halaqat={halaqat} />
    </div>
  );
}

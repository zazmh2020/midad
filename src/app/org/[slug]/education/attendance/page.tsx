import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import AttendanceView from '@/components/education/AttendanceView';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
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
          <span className="org-eyebrow">التعليم</span>
          <h1>الحضور</h1>
          <p>سجّل حضور الحلقة في تاريخ محدّد.</p>
        </div>
      </div>
      <AttendanceView halaqat={halaqat} />
    </div>
  );
}

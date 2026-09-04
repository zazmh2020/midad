import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import StudentsView from '@/components/education/StudentsView';

export const dynamic = 'force-dynamic';

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);

  const [students, halaqat] = await Promise.all([
    prisma.student.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, phone: true, guardianName: true, guardianPhone: true,
        status: true, halaqaId: true,
      },
    }),
    prisma.halaqa.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">التعليم</span>
          <h1>الطلاب</h1>
          <p>{students.length} طالب في {org.name}.</p>
        </div>
      </div>
      <StudentsView students={students} halaqat={halaqat} />
    </div>
  );
}

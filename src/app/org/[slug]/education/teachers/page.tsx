import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import TeachersView from '@/components/education/TeachersView';

export const dynamic = 'force-dynamic';

export default async function TeachersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);

  const teachers = await prisma.teacher.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, phone: true, specialization: true, isActive: true,
      _count: { select: { halaqat: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">التعليم</span>
          <h1>المعلمون</h1>
          <p>{teachers.length} معلّم في {org.name}.</p>
        </div>
      </div>
      <TeachersView teachers={teachers.map((t) => ({ ...t, halaqatCount: t._count.halaqat }))} />
    </div>
  );
}

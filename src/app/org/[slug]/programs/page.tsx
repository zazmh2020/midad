import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewPrograms, canManagePrograms } from '@/lib/permissions';
import ProgramsView from '@/components/ProgramsView';

export const dynamic = 'force-dynamic';

export default async function OrgProgramsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewPrograms(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManagePrograms(user.role);

  const [programs, departments] = await Promise.all([
    prisma.program.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        status: true,
        capacity: true,
        departmentId: true,
      },
    }),
    prisma.department.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">الوحدات</span>
          <h1>البرامج</h1>
          <p>{programs.length} برنامج في {org.name}.</p>
        </div>
      </div>

      <ProgramsView canManage={canManage} programs={programs} departments={departments} />
    </div>
  );
}

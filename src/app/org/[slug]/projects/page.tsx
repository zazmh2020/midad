import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewProjects, canManageProjects } from '@/lib/permissions';
import ProjectsView from '@/components/ProjectsView';

export const dynamic = 'force-dynamic';

export default async function OrgProjectsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewProjects(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageProjects(user.role);

  const [projects, departments] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
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
          <h1>المشاريع</h1>
          <p>{projects.length} مشروع في {org.name}.</p>
        </div>
      </div>

      <ProjectsView
        canManage={canManage}
        departments={departments}
        projects={projects.map((p) => ({
          ...p,
          startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : null,
          endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : null,
        }))}
      />
    </div>
  );
}

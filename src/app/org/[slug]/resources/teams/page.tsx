import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewHR } from '@/lib/permissions';
import TeamsView from '@/components/resources/TeamsView';

export const dynamic = 'force-dynamic';

export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canViewHR(user.role)) redirect(`/org/${org.slug}`);

  const [teams, departments] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, description: true, lead: true, departmentId: true, department: { select: { name: true } } },
    }),
    prisma.department.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">الموارد</span>
          <h1>الفرق</h1>
          <p>{teams.length} فريق في {org.name}.</p>
        </div>
      </div>
      <TeamsView
        departments={departments}
        teams={teams.map((t) => ({
          id: t.id, name: t.name, description: t.description, lead: t.lead,
          departmentId: t.departmentId, departmentName: t.department?.name ?? null,
        }))}
      />
    </div>
  );
}

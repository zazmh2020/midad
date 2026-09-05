import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewStructure, canManageStructure } from '@/lib/permissions';
import StructureView from '@/components/StructureView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgStructurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewStructure(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageStructure(user.role);

  const departments = await prisma.department.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.units')}</span>
          <h1>{t('struct.title')}</h1>
          <p>{t('struct.count', { n: departments.length, org: org.name })}</p>
        </div>
      </div>

      <StructureView
        canManage={canManage}
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          parentId: d.parentId,
          memberCount: d._count.members,
        }))}
      />
    </div>
  );
}

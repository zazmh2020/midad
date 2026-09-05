import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewBranches, canManageBranches } from '@/lib/permissions';
import BranchesView from '@/components/BranchesView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function BranchesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewBranches(user.role)) redirect(`/org/${org.slug}`);

  const branches = await prisma.branch.findMany({
    where: { organizationId: org.id },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, name: true, code: true, city: true, address: true, phone: true, manager: true, isActive: true },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.corp')}</span>
          <h1>{t('branch.pageTitle')}</h1>
          <p>{t('branch.pageSub', { n: branches.length, org: org.name })}</p>
        </div>
      </div>
      <BranchesView branches={branches} canManage={canManageBranches(user.role)} />
    </div>
  );
}

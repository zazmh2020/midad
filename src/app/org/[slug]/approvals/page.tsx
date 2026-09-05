import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewApprovals, canDecideApprovals } from '@/lib/permissions';
import ApprovalsView from '@/components/ApprovalsView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewApprovals(user.role)) redirect(`/org/${org.slug}`);

  const rows = await prisma.approval.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    include: {
      requestedBy: { select: { name: true } },
      decidedBy: { select: { name: true } },
    },
  });

  const approvals = rows.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    amount: a.amount ? a.amount.toString() : null,
    status: a.status,
    decisionNote: a.decisionNote,
    requestedByName: a.requestedBy?.name ?? null,
    decidedByName: a.decidedBy?.name ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.corp')}</span>
          <h1>{t('approval.pageTitle')}</h1>
          <p>{t('approval.pageSub', { n: approvals.length, org: org.name })}</p>
        </div>
      </div>
      <ApprovalsView approvals={approvals} canDecide={canDecideApprovals(user.role)} canCreate={canViewApprovals(user.role)} />
    </div>
  );
}

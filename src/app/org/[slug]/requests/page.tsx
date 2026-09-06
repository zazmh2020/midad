import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewRequests, canManageRequests } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import RequestsView from '@/components/RequestsView';

export const dynamic = 'force-dynamic';

export default async function OrgRequestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewRequests(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageRequests(user);

  // المدير يرى كل الطلبات؛ غيره يرى طلباته فقط
  const requests = await prisma.memberRequest.findMany({
    where: { organizationId: org.id, ...(canManage ? {} : { requesterId: user.id }) },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true, type: true, status: true, details: true, reply: true, createdAt: true,
      requesterId: true, requester: { select: { name: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.corp')}</span>
          <h1>{t('req.title')}</h1>
          <p>{canManage ? t('req.subAdmin', { org: org.name }) : t('req.subMember')}</p>
        </div>
      </div>

      <RequestsView
        canManage={canManage}
        requests={requests.map((r) => ({
          id: r.id, type: r.type, status: r.status, details: r.details, reply: r.reply,
          createdAt: r.createdAt.toISOString(), requesterName: r.requester.name, mine: r.requesterId === user.id,
        }))}
      />
    </div>
  );
}

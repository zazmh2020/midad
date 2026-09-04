import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewCampaigns, canManageCampaigns } from '@/lib/permissions';
import CampaignsView from '@/components/CampaignsView';

export const dynamic = 'force-dynamic';

export default async function OrgCampaignsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewCampaigns(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageCampaigns(user.role);

  const [campaigns, departments] = await Promise.all([
    prisma.campaign.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, description: true, type: true, status: true,
        goalAmount: true, startDate: true, endDate: true, departmentId: true,
        _count: { select: { donations: true } },
      },
    }),
    prisma.department.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">الوحدات</span>
          <h1>الحملات</h1>
          <p>{campaigns.length} حملة في {org.name}.</p>
        </div>
      </div>

      <CampaignsView
        canManage={canManage}
        departments={departments}
        campaigns={campaigns.map((c) => ({
          id: c.id, name: c.name, description: c.description, type: c.type, status: c.status,
          goalAmount: c.goalAmount, departmentId: c.departmentId, donationCount: c._count.donations,
          startDate: c.startDate ? c.startDate.toISOString().slice(0, 10) : null,
          endDate: c.endDate ? c.endDate.toISOString().slice(0, 10) : null,
        }))}
      />
    </div>
  );
}

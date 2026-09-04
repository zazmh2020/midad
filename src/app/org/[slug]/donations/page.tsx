import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewDonations, canManageDonations } from '@/lib/permissions';
import DonationsView from '@/components/DonationsView';

export const dynamic = 'force-dynamic';

export default async function OrgDonationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewDonations(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageDonations(user.role);

  const [donations, campaigns, receivedAgg] = await Promise.all([
    prisma.donation.findMany({
      where: { organizationId: org.id },
      orderBy: { donatedAt: 'desc' },
      select: {
        id: true, donorName: true, amount: true, method: true, status: true, note: true,
        donatedAt: true, campaignId: true,
      },
    }),
    prisma.campaign.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.donation.aggregate({ where: { organizationId: org.id, status: 'RECEIVED' }, _sum: { amount: true } }),
  ]);

  const totalReceived = receivedAgg._sum.amount ?? 0;

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">الوحدات</span>
          <h1>التبرعات</h1>
          <p>{donations.length} عملية في {org.name}.</p>
        </div>
      </div>

      <DonationsView
        canManage={canManage}
        campaigns={campaigns}
        totalReceived={totalReceived}
        donations={donations.map((d) => ({
          id: d.id, donorName: d.donorName, amount: d.amount, method: d.method, status: d.status,
          note: d.note, campaignId: d.campaignId, donatedAt: d.donatedAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}

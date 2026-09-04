import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewHR } from '@/lib/permissions';
import VolunteersView from '@/components/resources/VolunteersView';

export const dynamic = 'force-dynamic';

export default async function VolunteersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canViewHR(user.role)) redirect(`/org/${org.slug}`);

  const volunteers = await prisma.volunteer.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, phone: true, skills: true, status: true },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">الموارد</span>
          <h1>المتطوعون</h1>
          <p>{volunteers.length} متطوّع في {org.name}.</p>
        </div>
      </div>
      <VolunteersView volunteers={volunteers} />
    </div>
  );
}

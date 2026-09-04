import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewBeneficiaries, canManageBeneficiaries } from '@/lib/permissions';
import BeneficiariesView from '@/components/BeneficiariesView';

export const dynamic = 'force-dynamic';

export default async function OrgBeneficiariesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewBeneficiaries(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageBeneficiaries(user.role);

  const [beneficiaries, departments, programs] = await Promise.all([
    prisma.beneficiary.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, phone: true, nationalId: true, category: true, status: true,
        notes: true, departmentId: true, programId: true,
      },
    }),
    prisma.department.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.program.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">الوحدات</span>
          <h1>المستفيدون</h1>
          <p>{beneficiaries.length} ملف في {org.name}.</p>
        </div>
      </div>

      <BeneficiariesView
        canManage={canManage}
        departments={departments}
        programs={programs}
        beneficiaries={beneficiaries}
      />
    </div>
  );
}

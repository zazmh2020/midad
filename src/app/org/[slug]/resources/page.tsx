import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewBeneficiaries, canViewHR } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';

export const dynamic = 'force-dynamic';

export default async function ResourcesHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const r = user.role;

  if (!canViewBeneficiaries(r) && !canViewHR(r)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;
  const w = { organizationId: org.id };

  const [beneficiaries, employees, volunteers, teams] = await Promise.all([
    prisma.beneficiary.count({ where: w }),
    prisma.employee.count({ where: w }),
    prisma.volunteer.count({ where: w }),
    prisma.team.count({ where: w }),
  ]);

  const items: HubItem[] = [
    ...(canViewBeneficiaries(r)
      ? [{ title: 'المستفيدون', desc: 'ملفات الحالات والخدمات.', href: `${base}/beneficiaries`, count: beneficiaries }]
      : []),
    ...(canViewHR(r)
      ? [
          { title: 'الموظفون', desc: 'ملفات الموارد البشرية والمناصب.', href: `${base}/resources/employees`, count: employees },
          { title: 'المتطوعون', desc: 'سجل المتطوعين ومهاراتهم.', href: `${base}/resources/volunteers`, count: volunteers },
          { title: 'الفرق', desc: 'تكوين فرق العمل وإدارتها.', href: `${base}/resources/teams`, count: teams },
        ]
      : []),
  ];

  return (
    <SectionHub
      eyebrow="العمل المؤسسي"
      title="الموارد"
      intro="إدارة الموارد البشرية والمؤسسية."
      items={items}
    />
  );
}

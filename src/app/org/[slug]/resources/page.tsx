import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewBeneficiaries, canViewHR } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ResourcesHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
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
      ? [{ title: t('hub.res.beneficiaries'), desc: t('hub.res.beneficiaries.d'), href: `${base}/beneficiaries`, count: beneficiaries }]
      : []),
    ...(canViewHR(r)
      ? [
          { title: t('hub.res.employees'), desc: t('hub.res.employees.d'), href: `${base}/resources/employees`, count: employees },
          { title: t('hub.res.volunteers'), desc: t('hub.res.volunteers.d'), href: `${base}/resources/volunteers`, count: volunteers },
          { title: t('hub.res.teams'), desc: t('hub.res.teams.d'), href: `${base}/resources/teams`, count: teams },
        ]
      : []),
  ];

  return (
    <SectionHub
      eyebrow={t('hub.corp')}
      title={t('hub.res.title')}
      intro={t('hub.res.intro')}
      items={items}
    />
  );
}

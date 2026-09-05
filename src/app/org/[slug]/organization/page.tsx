import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewStructure, canViewUsers, canManageSettings } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrganizationHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const r = user.role;

  if (!(canViewStructure(r) || canViewUsers(r) || canManageSettings(r))) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;

  const [deptCount, userCount] = await Promise.all([
    prisma.department.count({ where: { organizationId: org.id } }),
    prisma.user.count({ where: { organizationId: org.id } }),
  ]);

  const items: HubItem[] = [
    ...(canManageSettings(r)
      ? [{ title: t('hub.org.data'), desc: t('hub.org.data.d'), href: `${base}/settings` }]
      : []),
    ...(canViewStructure(r)
      ? [{ title: t('hub.org.structure'), desc: t('hub.org.structure.d'), href: `${base}/structure`, count: deptCount }]
      : []),
    ...(canViewUsers(r)
      ? [{ title: t('hub.org.users'), desc: t('hub.org.users.d'), href: `${base}/users`, count: userCount }]
      : []),
    { title: t('hub.org.branches'), desc: t('hub.org.branches.d') },
  ];

  return (
    <SectionHub
      eyebrow={t('hub.corp')}
      title={t('hub.org.title')}
      intro={t('hub.org.intro', { org: org.name })}
      items={items}
    />
  );
}

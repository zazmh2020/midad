import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AdminHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canManageUsers(user.role)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;

  const userCount = await prisma.user.count({ where: { organizationId: org.id } });

  const items: HubItem[] = [
    { title: t('pg.admin.usersTitle'), desc: t('pg.admin.usersDesc'), href: `${base}/users`, count: userCount },
    { title: t('pg.admin.rolesTitle'), desc: t('pg.admin.rolesDesc'), href: `${base}/roles` },
    { title: t('pg.admin.unitsTitle'), desc: t('pg.admin.unitsDesc') },
  ];

  return (
    <SectionHub
      eyebrow={t('pg.eyeSystem')}
      title={t('pg.admin.title')}
      intro={t('pg.admin.intro')}
      items={items}
    />
  );
}

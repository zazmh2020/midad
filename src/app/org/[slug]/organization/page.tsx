import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewStructure, canViewUsers, canManageSettings } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';

export const dynamic = 'force-dynamic';

export default async function OrganizationHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const r = user.role;

  if (!(canViewStructure(r) || canViewUsers(r) || canManageSettings(r))) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;

  const [deptCount, userCount] = await Promise.all([
    prisma.department.count({ where: { organizationId: org.id } }),
    prisma.user.count({ where: { organizationId: org.id } }),
  ]);

  const items: HubItem[] = [
    ...(canManageSettings(r)
      ? [{ title: 'بيانات المؤسسة', desc: 'الاسم والنوع والرابط الفرعي.', href: `${base}/settings` }]
      : []),
    ...(canViewStructure(r)
      ? [{ title: 'الهيكل التنظيمي', desc: 'إدارات وأقسام وفروع.', href: `${base}/structure`, count: deptCount }]
      : []),
    ...(canViewUsers(r)
      ? [{ title: 'المستخدمون', desc: 'حسابات المؤسسة وأدوارها.', href: `${base}/users`, count: userCount }]
      : []),
    { title: 'الفروع', desc: 'إدارة فروع المؤسسة الجغرافية.' },
  ];

  return (
    <SectionHub
      eyebrow="العمل المؤسسي"
      title="المؤسسة"
      intro={`كل ما يتعلق بـ ${org.name} نفسها.`}
      items={items}
    />
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';

export const dynamic = 'force-dynamic';

export default async function AdminHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canManageUsers(user.role)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;

  const userCount = await prisma.user.count({ where: { organizationId: org.id } });

  const items: HubItem[] = [
    { title: 'إدارة المستخدمين', desc: 'إضافة الحسابات وتفعيلها وإيقافها.', href: `${base}/users`, count: userCount },
    { title: 'الأدوار والصلاحيات', desc: 'ضبط ما يراه كل دور ويعدّله.' },
    { title: 'الوحدات', desc: 'تفعيل وحدات المؤسسة حسب الحاجة.' },
  ];

  return (
    <SectionHub
      eyebrow="النظام"
      title="الإدارة"
      intro="إدارة المستخدمين والأدوار والوحدات."
      items={items}
    />
  );
}

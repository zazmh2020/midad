import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewProjects, canViewPrograms, canViewCampaigns, canViewDonations } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';

export const dynamic = 'force-dynamic';

export default async function OperationsHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const r = user.role;

  if (!(canViewProjects(r) || canViewCampaigns(r))) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;
  const w = { organizationId: org.id };

  const [projects, programs, campaigns, donations] = await Promise.all([
    prisma.project.count({ where: w }),
    prisma.program.count({ where: w }),
    prisma.campaign.count({ where: w }),
    prisma.donation.count({ where: w }),
  ]);

  const items: HubItem[] = [
    ...(canViewProjects(r)
      ? [{ title: 'المشاريع', desc: 'مراحل التنفيذ والمتابعة.', href: `${base}/projects`, count: projects }]
      : []),
    ...(canViewPrograms(r)
      ? [{ title: 'البرامج', desc: 'برامج مصنّفة بسعة مستهدفة.', href: `${base}/programs`, count: programs }]
      : []),
    ...(canViewCampaigns(r)
      ? [{ title: 'الحملات', desc: 'حملات بهدف مالي ومواعيد.', href: `${base}/campaigns`, count: campaigns }]
      : []),
    ...(canViewDonations(r)
      ? [{ title: 'التبرعات', desc: 'العمليات المالية الواردة.', href: `${base}/donations`, count: donations }]
      : []),
    { title: 'المهام', desc: 'إسناد المهام ومتابعة إنجازها.' },
    { title: 'سير العمل', desc: 'مسارات اعتماد وأتمتة العمليات.' },
  ];

  return (
    <SectionHub
      eyebrow="العمل المؤسسي"
      title="العمليات"
      intro="إدارة العمل اليومي للمؤسسة."
      items={items}
    />
  );
}

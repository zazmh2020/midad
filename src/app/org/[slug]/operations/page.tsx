import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewProjects, canViewPrograms, canViewCampaigns, canViewDonations, canViewTasks, canViewApprovals, canViewBranches } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OperationsHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const r = user.role;

  if (!(canViewProjects(r) || canViewCampaigns(r))) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;
  const w = { organizationId: org.id };

  const [projects, programs, campaigns, donations, tasks, approvals, branches] = await Promise.all([
    prisma.project.count({ where: w }),
    prisma.program.count({ where: w }),
    prisma.campaign.count({ where: w }),
    prisma.donation.count({ where: w }),
    prisma.task.count({ where: w }),
    prisma.approval.count({ where: { ...w, status: 'PENDING' } }),
    prisma.branch.count({ where: w }),
  ]);

  const items: HubItem[] = [
    ...(canViewProjects(r)
      ? [{ title: t('hub.ops.projects'), desc: t('hub.ops.projects.d'), href: `${base}/projects`, count: projects }]
      : []),
    ...(canViewPrograms(r)
      ? [{ title: t('hub.ops.programs'), desc: t('hub.ops.programs.d'), href: `${base}/programs`, count: programs }]
      : []),
    ...(canViewCampaigns(r)
      ? [{ title: t('hub.ops.campaigns'), desc: t('hub.ops.campaigns.d'), href: `${base}/campaigns`, count: campaigns }]
      : []),
    ...(canViewDonations(r)
      ? [{ title: t('hub.ops.donations'), desc: t('hub.ops.donations.d'), href: `${base}/donations`, count: donations }]
      : []),
    ...(canViewTasks(r)
      ? [{ title: t('hub.ops.tasks'), desc: t('hub.ops.tasks.d'), href: `${base}/tasks`, count: tasks }]
      : []),
    ...(canViewApprovals(r)
      ? [{ title: t('hub.ops.workflow'), desc: t('hub.ops.workflow.d'), href: `${base}/approvals`, count: approvals }]
      : []),
    ...(canViewBranches(r)
      ? [{ title: t('hub.ops.branches'), desc: t('hub.ops.branches.d'), href: `${base}/branches`, count: branches }]
      : []),
  ];

  return (
    <SectionHub
      eyebrow={t('hub.corp')}
      title={t('hub.ops.title')}
      intro={t('hub.ops.intro')}
      items={items}
    />
  );
}

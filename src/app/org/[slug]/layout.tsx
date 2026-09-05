import type { ReactNode } from 'react';
import { requireOrgAccess } from '@/lib/org';
import {
  canViewUsers, canManageSettings, canViewProjects, canViewStructure,
  canViewCampaigns, canViewBeneficiaries, canViewKnowledge, canViewReports,
  canViewDocuments, canUseAssistant, canManageUsers, canViewRequests,
} from '@/lib/permissions';
import OrgShell, { type NavEntry } from '@/components/OrgShell';
import { getOrgInbox } from '@/lib/inbox';
import { moduleEnabled } from '@/lib/modules';
import { getT } from '@/lib/i18n/server';
import '@/styles/org.css';

export const dynamic = 'force-dynamic';

/* الطبقات الثلاث للتنقّل:
   1) العمل المؤسسي  2) المعرفة والذكاء  3) إدارة النظام */
export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const r = user.role;
  const base = `/org/${org.slug}`;
  const inbox = await getOrgInbox(org.id);
  const { t } = await getT();

  // الوحدات المفعّلة لهذه المؤسسة
  const md = org.disabledModules;

  // الطبقة الأولى — العمل المؤسسي (الصلاحية + تفعيل الوحدة)
  const orgSection = canViewStructure(r) || canViewUsers(r) || canManageSettings(r);
  const opsSection = (canViewProjects(r) || canViewCampaigns(r)) && moduleEnabled(md, 'operations');
  const resourcesSection = canViewBeneficiaries(r) && moduleEnabled(md, 'resources');
  const educationSection = canViewProjects(r) && moduleEnabled(md, 'education'); // موظفو المؤسسة يديرون التعليم

  const nav: NavEntry[] = [
    { kind: 'link', href: base, label: t('onav.dashboard'), icon: 'home' },
    ...(orgSection
      ? ([{ kind: 'link', href: `${base}/organization`, label: t('onav.organization'), icon: 'organization',
          match: [`${base}/organization`, `${base}/structure`, `${base}/users`] }] as NavEntry[])
      : []),
    ...(opsSection
      ? ([{ kind: 'link', href: `${base}/operations`, label: t('onav.operations'), icon: 'operations',
          match: [`${base}/operations`, `${base}/projects`, `${base}/programs`, `${base}/campaigns`, `${base}/donations`] }] as NavEntry[])
      : []),
    ...(resourcesSection
      ? ([{ kind: 'link', href: `${base}/resources`, label: t('onav.resources'), icon: 'resources',
          match: [`${base}/resources`, `${base}/beneficiaries`] }] as NavEntry[])
      : []),
    ...(educationSection
      ? ([
          { kind: 'link', href: `${base}/education`, label: t('onav.education'), icon: 'education', match: [`${base}/education`] },
          { kind: 'link', href: `${base}/education/plans`, label: t('onav.plans'), icon: 'plans' },
          { kind: 'link', href: `${base}/education/competitions`, label: t('onav.competitions'), icon: 'competitions' },
          { kind: 'link', href: `${base}/education/certificates`, label: t('onav.certificates'), icon: 'certificates' },
        ] as NavEntry[])
      : []),
    ...(canViewRequests(r)
      ? ([{ kind: 'link', href: `${base}/requests`, label: t('onav.requests'), icon: 'documents',
          match: [`${base}/requests`] }] as NavEntry[])
      : []),

    // الطبقة الثانية — المعرفة والذكاء
    { kind: 'divider', label: t('onav.div.knowledge') },
    ...(canViewDocuments(r) && moduleEnabled(md, 'documents')
      ? ([{ kind: 'link', href: `${base}/documents`, label: t('onav.documents'), icon: 'documents' }] as NavEntry[])
      : []),
    ...(canViewKnowledge(r) && moduleEnabled(md, 'knowledge')
      ? ([{ kind: 'link', href: `${base}/knowledge`, label: t('onav.knowledge'), icon: 'knowledge' }] as NavEntry[])
      : []),
    ...(canViewReports(r) && moduleEnabled(md, 'reports')
      ? ([{ kind: 'link', href: `${base}/reports`, label: t('onav.reports'), icon: 'reports' }] as NavEntry[])
      : []),
    ...(educationSection
      ? ([{ kind: 'link', href: `${base}/education/statistics`, label: t('onav.statistics'), icon: 'statistics' }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/identity`, label: t('onav.identity'), icon: 'identity' },
    ...(canUseAssistant(r) && moduleEnabled(md, 'assistant')
      ? ([{ kind: 'link', href: `${base}/assistant`, label: t('onav.assistant'), icon: 'assistant' }] as NavEntry[])
      : []),

    // الطبقة الثالثة — إدارة النظام
    { kind: 'divider', label: t('onav.div.system') },
    ...(canManageSettings(r) && moduleEnabled(md, 'content')
      ? ([{ kind: 'link', href: `${base}/content`, label: t('onav.content'), icon: 'content' }] as NavEntry[])
      : []),
    ...(canManageUsers(r)
      ? ([{ kind: 'link', href: `${base}/admin`, label: t('onav.admin'), icon: 'admin' }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/settings`, label: t('onav.settings'), icon: 'settings' },
  ];

  return (
    <OrgShell
      org={{ name: org.name, slug: org.slug, brandColor: org.brandColor, logoUrl: org.logoUrl }}
      user={{ name: user.name, role: user.role, email: user.email, avatarUrl: user.avatarUrl, jobTitle: user.jobTitle }}
      nav={nav}
      inbox={inbox}
    >
      {children}
    </OrgShell>
  );
}

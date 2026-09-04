import type { ReactNode } from 'react';
import { requireOrgAccess } from '@/lib/org';
import {
  canViewUsers, canManageSettings, canViewProjects, canViewStructure,
  canViewCampaigns, canViewBeneficiaries, canViewKnowledge, canViewReports,
  canViewDocuments, canUseAssistant, canManageUsers,
} from '@/lib/permissions';
import OrgShell, { type NavEntry } from '@/components/OrgShell';
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

  // الطبقة الأولى — العمل المؤسسي
  const orgSection = canViewStructure(r) || canViewUsers(r) || canManageSettings(r);
  const opsSection = canViewProjects(r) || canViewCampaigns(r);
  const resourcesSection = canViewBeneficiaries(r);
  const educationSection = canViewProjects(r); // موظفو المؤسسة يديرون التعليم

  const nav: NavEntry[] = [
    { kind: 'link', href: base, label: 'لوحة التحكم', icon: 'home' },
    ...(orgSection
      ? ([{ kind: 'link', href: `${base}/organization`, label: 'المؤسسة', icon: 'organization',
          match: [`${base}/organization`, `${base}/structure`, `${base}/users`] }] as NavEntry[])
      : []),
    ...(opsSection
      ? ([{ kind: 'link', href: `${base}/operations`, label: 'العمليات', icon: 'operations',
          match: [`${base}/operations`, `${base}/projects`, `${base}/programs`, `${base}/campaigns`, `${base}/donations`] }] as NavEntry[])
      : []),
    ...(resourcesSection
      ? ([{ kind: 'link', href: `${base}/resources`, label: 'الموارد', icon: 'resources',
          match: [`${base}/resources`, `${base}/beneficiaries`] }] as NavEntry[])
      : []),
    ...(educationSection
      ? ([{ kind: 'link', href: `${base}/education`, label: 'التعليم', icon: 'education' }] as NavEntry[])
      : []),

    // الطبقة الثانية — المعرفة والذكاء
    { kind: 'divider', label: 'المعرفة والذكاء' },
    ...(canViewDocuments(r)
      ? ([{ kind: 'link', href: `${base}/documents`, label: 'المستندات', icon: 'documents' }] as NavEntry[])
      : []),
    ...(canViewKnowledge(r)
      ? ([{ kind: 'link', href: `${base}/knowledge`, label: 'قاعدة المعرفة', icon: 'knowledge' }] as NavEntry[])
      : []),
    ...(canViewReports(r)
      ? ([{ kind: 'link', href: `${base}/reports`, label: 'التحليلات', icon: 'reports' }] as NavEntry[])
      : []),
    ...(educationSection
      ? ([{ kind: 'link', href: `${base}/education/statistics`, label: 'الإحصاءات', icon: 'statistics' }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/identity`, label: 'الهوية الرقمية', icon: 'identity' },
    ...(canUseAssistant(r)
      ? ([{ kind: 'link', href: `${base}/assistant`, label: 'مِداد AI', icon: 'assistant' }] as NavEntry[])
      : []),

    // الطبقة الثالثة — إدارة النظام
    { kind: 'divider', label: 'النظام' },
    ...(canManageUsers(r)
      ? ([{ kind: 'link', href: `${base}/admin`, label: 'الإدارة', icon: 'admin' }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/settings`, label: 'الإعدادات', icon: 'settings' },
  ];

  return (
    <OrgShell
      org={{ name: org.name, slug: org.slug, brandColor: org.brandColor, logoUrl: org.logoUrl }}
      user={{ name: user.name, role: user.role, email: user.email, avatarUrl: user.avatarUrl }}
      nav={nav}
    >
      {children}
    </OrgShell>
  );
}

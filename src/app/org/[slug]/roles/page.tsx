import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import CustomRolesView from '@/components/CustomRolesView';
import { getT } from '@/lib/i18n/server';
import {
  canManageUsers, canManageSettings,
  canViewProjects, canManageProjects,
  canViewStructure, canManageStructure,
  canViewPrograms, canManagePrograms,
  canViewCampaigns, canManageCampaigns,
  canViewBeneficiaries, canManageBeneficiaries,
  canViewDonations, canManageDonations,
  canViewKnowledge, canManageKnowledge,
  canViewReports,
  canViewDocuments, canManageDocuments,
  canViewEducation, canManageEducation,
  canViewHR, canManageHR,
  canViewTasks, canManageTasks,
} from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const ROLES = ['ORG_ADMIN', 'STAFF', 'MEMBER'] as const;

/** كل وحدة: مفتاح الترجمة + دالة العرض + دالة الإدارة (إن وُجدت) */
const MODULES: { key: string; view?: (r: string) => boolean; manage?: (r: string) => boolean }[] = [
  { key: 'hub.ops.projects', view: canViewProjects, manage: canManageProjects },
  { key: 'hub.ops.programs', view: canViewPrograms, manage: canManagePrograms },
  { key: 'hub.ops.campaigns', view: canViewCampaigns, manage: canManageCampaigns },
  { key: 'hub.ops.donations', view: canViewDonations, manage: canManageDonations },
  { key: 'hub.ops.tasks', view: canViewTasks, manage: canManageTasks },
  { key: 'hub.res.beneficiaries', view: canViewBeneficiaries, manage: canManageBeneficiaries },
  { key: 'onav.resources', view: canViewHR, manage: canManageHR },
  { key: 'onav.education', view: canViewEducation, manage: canManageEducation },
  { key: 'onav.documents', view: canViewDocuments, manage: canManageDocuments },
  { key: 'onav.knowledge', view: canViewKnowledge, manage: canManageKnowledge },
  { key: 'roles.mod.structure', view: canViewStructure, manage: canManageStructure },
  { key: 'onav.reports', view: canViewReports },
  { key: 'roles.mod.users', manage: canManageUsers },
  { key: 'onav.settings', manage: canManageSettings },
];

function level(m: { view?: (r: string) => boolean; manage?: (r: string) => boolean }, role: string): 'manage' | 'view' | 'none' {
  if (m.manage?.(role)) return 'manage';
  if (m.view?.(role)) return 'view';
  return 'none';
}

export default async function RolesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  // تُعرض لمن يدير المستخدمين (مدير المؤسسة)
  if (!canManageUsers(user)) redirect(`/org/${org.slug}`);

  const customRoles = await prisma.customRole.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, permissions: true, _count: { select: { members: true } } },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeSystem')}</span>
          <h1>{t('roles.title')}</h1>
          <p>{t('roles.sub')}</p>
        </div>
      </div>

      <div className="org-table-wrap">
        <table className="org-matrix">
          <thead>
            <tr>
              <th className="org-matrix-mod">{t('roles.colModule')}</th>
              {ROLES.map((r) => <th key={r}>{t(`role.${r}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key}>
                <td className="org-matrix-mod">{t(m.key)}</td>
                {ROLES.map((r) => {
                  const lv = level(m, r);
                  return (
                    <td key={r}>
                      <span className={`org-lvl org-lvl-${lv}`}>{t(`roles.level.${lv}`)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="org-matrix-legend">{t('roles.legend')}</p>

      <CustomRolesView
        roles={customRoles.map((r) => ({ id: r.id, name: r.name, permissions: r.permissions, memberCount: r._count.members }))}
      />
    </div>
  );
}

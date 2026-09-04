import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import {
  canViewUsers, canManageUsers, canViewProjects, canViewStructure, canViewPrograms,
  canViewCampaigns, canViewBeneficiaries, canViewReports,
  canViewDocuments, canUseAssistant,
  roleLabel,
} from '@/lib/permissions';
import Icon from '@/components/Icon';
import DashboardShell from '@/components/dash/DashboardShell';
import StatCard, { type StatColor } from '@/components/dash/StatCard';
import AreaChart from '@/components/dash/AreaChart';
import DonutRing from '@/components/dash/DonutRing';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');
const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('ar', { weekday: 'short' });

const TYPE_LABELS: Record<string, string> = {
  ASSOCIATION: 'جمعية / مؤسسة',
  MOSQUE: 'مسجد / مركز قرآني',
  SCHOOL: 'مركز تعليمي',
  PROJECT: 'مشروع خاص',
};

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function bucketByDay(dates: Date[], days: Date[]): number[] {
  return days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return dates.filter((x) => x >= day && x < next).length;
  });
}

export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  const w = { organizationId: org.id };
  const days = buildDays();
  const weekAgo = days[0];

  const [
    total, active, projectCount, deptCount, programCount, campaignCount, beneficiaryCount,
    newUsers7, newProjects7, recentUsers, latestProject, latestCampaign, latestProgram,
  ] = await Promise.all([
    prisma.user.count({ where: w }),
    prisma.user.count({ where: { ...w, isActive: true } }),
    prisma.project.count({ where: w }),
    prisma.department.count({ where: w }),
    prisma.program.count({ where: w }),
    prisma.campaign.count({ where: w }),
    prisma.beneficiary.count({ where: w }),
    prisma.user.findMany({ where: { ...w, createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
    prisma.project.findMany({ where: { ...w, createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({
      where: w, orderBy: { createdAt: 'desc' }, take: 5,
      select: { name: true, role: true, isActive: true, createdAt: true, department: { select: { name: true } } },
    }),
    prisma.project.findFirst({ where: w, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true } }),
    prisma.campaign.findFirst({ where: w, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true } }),
    prisma.program.findFirst({ where: w, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true } }),
  ]);

  const canUsers = canViewUsers(user.role);
  const canManage = canManageUsers(user.role);
  const canProjects = canViewProjects(user.role);
  const canStructure = canViewStructure(user.role);
  const canPrograms = canViewPrograms(user.role);
  const canCampaigns = canViewCampaigns(user.role);
  const canBeneficiaries = canViewBeneficiaries(user.role);
  const canReports = canViewReports(user.role);
  const canDocuments = canViewDocuments(user.role);
  const canAssistant = canUseAssistant(user.role);

  const labels = days.map((d) => weekdayFmt.format(d));
  const usersSeries = bucketByDay(newUsers7.map((u) => u.createdAt), days);
  const projectsSeries = bucketByDay(newProjects7.map((p) => p.createdAt), days);
  const hasSeries = usersSeries.some((v) => v > 0) || projectsSeries.some((v) => v > 0);
  const activeRatio = total > 0 ? Math.round((active / total) * 100) : 0;

  // بطاقات الإحصاء (مقيّدة بالصلاحيات)
  const stats: { icon: string; color: StatColor; label: string; value: string; trend?: string }[] = [];
  if (canUsers) {
    stats.push({ icon: 'people/people-users', color: 'purple', label: 'إجمالي المستخدمين', value: numFmt.format(total), trend: newUsers7.length ? `${newUsers7.length} هذا الأسبوع` : undefined });
    stats.push({ icon: 'people/people-members', color: 'green', label: 'النشطون', value: numFmt.format(active) });
  }
  if (canStructure) stats.push({ icon: 'organization/organization-structure', color: 'blue', label: 'الوحدات التنظيمية', value: numFmt.format(deptCount) });
  if (canProjects) stats.push({ icon: 'operations/operations-projects', color: 'gold', label: 'المشاريع', value: numFmt.format(projectCount), trend: newProjects7.length ? `${newProjects7.length} هذا الأسبوع` : undefined });
  if (canPrograms) stats.push({ icon: 'operations/operations-programs', color: 'purple', label: 'البرامج', value: numFmt.format(programCount) });
  if (canCampaigns) stats.push({ icon: 'operations/operations-campaigns', color: 'gold', label: 'الحملات', value: numFmt.format(campaignCount) });
  if (canBeneficiaries) stats.push({ icon: 'people/people-beneficiaries', color: 'green', label: 'المستفيدون', value: numFmt.format(beneficiaryCount) });
  const topStats = stats.slice(0, 4);

  // آخر النشاطات (من أحدث السجلات الحقيقية)
  const activity: { icon: string; color: string; title: string; text: string; at: Date }[] = [];
  if (canProjects && latestProject) activity.push({ icon: 'operations/operations-projects', color: '', title: 'مشروع', text: latestProject.name, at: latestProject.createdAt });
  if (canCampaigns && latestCampaign) activity.push({ icon: 'operations/operations-campaigns', color: 'gold', title: 'حملة', text: latestCampaign.name, at: latestCampaign.createdAt });
  if (canPrograms && latestProgram) activity.push({ icon: 'operations/operations-programs', color: 'green', title: 'برنامج', text: latestProgram.name, at: latestProgram.createdAt });
  if (canUsers && recentUsers[0]) activity.push({ icon: 'people/people-users', color: 'blue', title: 'عضو جديد', text: recentUsers[0].name, at: recentUsers[0].createdAt });
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const activityTop = activity.slice(0, 4);

  const modules = [
    canStructure && { href: `/org/${org.slug}/organization`, icon: 'organization/organization-institution', title: 'المؤسسة', text: 'البيانات والهيكل' },
    canProjects && { href: `/org/${org.slug}/operations`, icon: 'operations/operations-activities', title: 'العمليات', text: 'المشاريع والبرامج' },
    canBeneficiaries && { href: `/org/${org.slug}/resources`, icon: 'people/people-groups', title: 'الموارد', text: 'المستفيدون والفرق' },
    canProjects && { href: `/org/${org.slug}/education`, icon: 'education/education-education', title: 'التعليم', text: 'الطلاب والحلقات' },
    canDocuments && { href: `/org/${org.slug}/documents`, icon: 'documents/documents-documents', title: 'المستندات', text: 'الملفات والأرشيف' },
    canReports && { href: `/org/${org.slug}/reports`, icon: 'analytics/analytics-analytics', title: 'التحليلات', text: 'التقارير والمؤشرات' },
    canAssistant && { href: `/org/${org.slug}/assistant`, icon: 'ai/ai-ai-assistant', title: 'مِداد AI', text: 'مساعد ذكي' },
    canManage && { href: `/org/${org.slug}/admin`, icon: 'administration/administration-system-settings', title: 'الإدارة', text: 'الأدوار والوحدات' },
  ].filter(Boolean) as { href: string; icon: string; title: string; text: string }[];

  return (
    <div className="org-page">
      <DashboardShell>
        {/* رأس الصفحة */}
        <div className="dash-hd">
          <div>
            <span className="dash-eyebrow">لوحة المؤسسة</span>
            <h1>مرحباً، {user.name} 👋</h1>
            <p className="dash-sub">
              {org.name} — {TYPE_LABELS[org.type] ?? org.type} · دورك:{' '}
              <strong>{roleLabel(user.role)}</strong>
            </p>
          </div>
          {canManage && (
            <div className="dash-hd-actions">
              <Link href={`/org/${org.slug}/users/new`} className="dash-btn">
                <Icon name="actions/actions-add" size={16} /> إضافة مستخدم
              </Link>
            </div>
          )}
        </div>

        {/* الإحصائيات */}
        {topStats.length > 0 && (
          <div className="dash-stats">
            {topStats.map((s) => (
              <StatCard key={s.label} icon={s.icon} color={s.color} label={s.label} value={s.value} trend={s.trend} />
            ))}
          </div>
        )}

        {/* الشبكة الرئيسية: رسم + حلقة */}
        {canUsers && (
          <div className="dash-grid-main">
            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>نشاط المؤسسة — آخر ٧ أيام</h3>
                {canReports && <Link href={`/org/${org.slug}/reports`} className="dash-link">عرض التفاصيل ←</Link>}
              </div>
              {hasSeries ? (
                <>
                  <AreaChart
                    labels={labels}
                    series={[
                      { color: '#6B57A0', values: usersSeries },
                      { color: '#B8860B', values: projectsSeries, dashed: true },
                    ]}
                  />
                  <div className="dash-chart-legend">
                    <span><span className="dot" style={{ background: '#6B57A0' }} />أعضاء جدد</span>
                    <span><span className="dot" style={{ background: '#B8860B' }} />مشاريع</span>
                  </div>
                </>
              ) : (
                <p className="dash-chart-empty">لا يوجد نشاط مُسجَّل خلال آخر سبعة أيام.</p>
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>نسبة النشاط</h3>
                <span className="dash-link">المستخدمون</span>
              </div>
              <DonutRing
                percent={activeRatio}
                label="من المستخدمين نشطون"
                hint={`${numFmt.format(active)} من أصل ${numFmt.format(total)} مستخدمًا نشطون حاليًا`}
              />
            </div>
          </div>
        )}

        {/* الشبكة السفلية: جدول + جانب */}
        <div className="dash-grid-bottom">
          {canUsers ? (
            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>أحدث المستخدمين</h3>
                <Link href={`/org/${org.slug}/users`} className="dash-link">كل المستخدمين ←</Link>
              </div>
              {recentUsers.length === 0 ? (
                <p className="dash-ann-empty">لا يوجد مستخدمون بعد.</p>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>أُضيف</th></tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u, i) => (
                      <tr key={i}>
                        <td>
                          <div className="dash-cell-user">
                            <span className="dash-avatar">{u.name.charAt(0)}</span>
                            <div>
                              <div className="n">{u.name}</div>
                              {u.department?.name && <div className="s">{u.department.name}</div>}
                            </div>
                          </div>
                        </td>
                        <td>{roleLabel(u.role)}</td>
                        <td><span className={`dash-badge ${u.isActive ? 'green' : 'muted'}`}>{u.isActive ? 'نشط' : 'معطّل'}</span></td>
                        <td>{dateFmt.format(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="dash-card">
              <div className="dash-card-hd"><h3>الوصول السريع</h3></div>
              <div className="dash-modules">
                {modules.map((m) => (
                  <Link key={m.href} href={m.href} className="dash-module">
                    <span className="dash-module-ic"><Icon name={m.icon} size={18} /></span>
                    <span><strong>{m.title}</strong><span>{m.text}</span></span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="dash-side">
            <div className="dash-card">
              <div className="dash-card-hd"><h3>آخر النشاطات</h3></div>
              {activityTop.length === 0 ? (
                <p className="dash-ann-empty">لا نشاط حديث.</p>
              ) : (
                <div className="dash-ann-list">
                  {activityTop.map((a, i) => (
                    <div key={i} className="dash-ann">
                      <span className={`dash-ann-ic ${a.color}`}><Icon name={a.icon} size={16} /></span>
                      <div className="dash-ann-body">
                        <div className="dash-ann-title">{a.title}</div>
                        <div className="dash-ann-text">{a.text}</div>
                        <div className="dash-ann-time">{dateFmt.format(a.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canReports && (
              <div className="dash-promo">
                <h4>تقاريرك جاهزة</h4>
                <p>اطّلع على مؤشرات الأداء والإحصاءات المبنية من بيانات مؤسستك.</p>
                <Link href={`/org/${org.slug}/reports`} className="dash-promo-btn">
                  <Icon name="analytics/analytics-analytics" size={14} /> عرض التحليلات
                </Link>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Icon from '@/components/Icon';
import DashboardShell from '@/components/dash/DashboardShell';
import StatCard from '@/components/dash/StatCard';
import AreaChart from '@/components/dash/AreaChart';
import DonutRing from '@/components/dash/DonutRing';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');
const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
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

export default async function AdminOverview() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const days = buildDays();
  const weekAgo = days[0];

  const [
    orgCount, activeOrgCount, userCount, newThisMonth,
    byType, recent, newOrgs7, newUsers7,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: { not: 'PLATFORM_OWNER' } } }),
    prisma.organization.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.organization.groupBy({ by: ['type'], _count: true }),
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' }, take: 6,
      select: { name: true, slug: true, type: true, isActive: true, createdAt: true, _count: { select: { users: true } } },
    }),
    prisma.organization.findMany({ where: { createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { role: { not: 'PLATFORM_OWNER' }, createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
  ]);

  const avgUsers = orgCount > 0 ? Math.round((userCount / orgCount) * 10) / 10 : 0;
  const activeRatio = orgCount > 0 ? Math.round((activeOrgCount / orgCount) * 100) : 0;

  const labels = days.map((d) => weekdayFmt.format(d));
  const orgsSeries = bucketByDay(newOrgs7.map((o) => o.createdAt), days);
  const usersSeries = bucketByDay(newUsers7.map((u) => u.createdAt), days);
  const hasSeries = orgsSeries.some((v) => v > 0) || usersSeries.some((v) => v > 0);

  const typeMax = Math.max(1, ...byType.map((t) => t._count));
  const typeData = byType
    .map((t) => ({ label: TYPE_LABELS[t.type] ?? t.type, value: t._count }))
    .sort((a, b) => b.value - a.value);

  if (orgCount === 0) {
    return (
      <div className="dash">
        <div className="admin-page-header">
          <div>
            <h1>نظرة عامة</h1>
            <p>ملخص حالة المنصة والمؤسسات المسجّلة.</p>
          </div>
          <Link href="/admin/organizations/new" className="btn-admin-primary">+ إنشاء مؤسسة</Link>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="32" height="32" rx="3" />
              <path d="M16 8v32M32 8v32M8 16h32M8 32h32" />
            </svg>
          </div>
          <h2>لا توجد مؤسسات بعد</h2>
          <p>ابدأ بإنشاء أول مؤسسة على المنصة.</p>
          <Link href="/admin/organizations/new" className="btn-admin-primary">إنشاء مؤسسة جديدة</Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="dash-hd">
        <div>
          <span className="dash-eyebrow">مالك المنصة</span>
          <h1>نظرة عامة 👋</h1>
          <p className="dash-sub">ملخص حالة المنصة والمؤسسات المسجّلة.</p>
        </div>
        <div className="dash-hd-actions">
          <Link href="/admin/organizations/new" className="dash-btn">
            <Icon name="actions/actions-add" size={16} /> إنشاء مؤسسة
          </Link>
        </div>
      </div>

      <div className="dash-stats">
        <StatCard icon="organization/organization-institution" color="purple" label="إجمالي المؤسسات" value={numFmt.format(orgCount)} trend={newThisMonth ? `${newThisMonth} هذا الشهر` : undefined} />
        <StatCard icon="organization/organization-building" color="green" label="المؤسسات النشطة" value={numFmt.format(activeOrgCount)} />
        <StatCard icon="people/people-users" color="blue" label="إجمالي المستخدمين" value={numFmt.format(userCount)} />
        <StatCard icon="analytics/analytics-kpi" color="gold" label="متوسط المستخدمين / مؤسسة" value={numFmt.format(avgUsers)} />
      </div>

      <div className="dash-grid-main">
        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>نمو المنصة — آخر ٧ أيام</h3>
            <Link href="/admin/organizations" className="dash-link">المؤسسات ←</Link>
          </div>
          {hasSeries ? (
            <>
              <AreaChart
                labels={labels}
                series={[
                  { color: '#6B57A0', values: usersSeries },
                  { color: '#B8860B', values: orgsSeries, dashed: true },
                ]}
              />
              <div className="dash-chart-legend">
                <span><span className="dot" style={{ background: '#6B57A0' }} />مستخدمون جدد</span>
                <span><span className="dot" style={{ background: '#B8860B' }} />مؤسسات جديدة</span>
              </div>
            </>
          ) : (
            <p className="dash-chart-empty">لا يوجد نشاط تسجيل خلال آخر سبعة أيام.</p>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>نسبة التفعيل</h3>
            <span className="dash-link">المؤسسات</span>
          </div>
          <DonutRing
            percent={activeRatio}
            label="من المؤسسات نشطة"
            hint={`${numFmt.format(activeOrgCount)} من أصل ${numFmt.format(orgCount)} مؤسسة نشطة`}
          />
        </div>
      </div>

      <div className="dash-grid-bottom">
        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>أحدث المؤسسات</h3>
            <Link href="/admin/organizations" className="dash-link">عرض الكل ←</Link>
          </div>
          <table className="dash-table">
            <thead>
              <tr><th>الاسم</th><th>النوع</th><th>المستخدمون</th><th>الحالة</th><th>الإنشاء</th></tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.slug}>
                  <td>
                    <div className="dash-cell-user">
                      <span className="dash-avatar">{o.name.charAt(0)}</span>
                      <div className="n">{o.name}</div>
                    </div>
                  </td>
                  <td>{TYPE_LABELS[o.type] ?? o.type}</td>
                  <td>{numFmt.format(o._count.users)}</td>
                  <td><span className={`dash-badge ${o.isActive ? 'green' : 'muted'}`}>{o.isActive ? 'نشطة' : 'معطّلة'}</span></td>
                  <td>{dateFmt.format(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dash-side">
          <div className="dash-card">
            <div className="dash-card-hd"><h3>توزيع المؤسسات حسب النوع</h3></div>
            <div className="dash-ann-list">
              {typeData.map((t) => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '13px' }}>
                  <span style={{ flex: '0 0 110px', color: 'var(--gray-700)' }}>{t.label}</span>
                  <span style={{ flex: 1, height: 8, borderRadius: 100, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${(t.value / typeMax) * 100}%`, background: 'linear-gradient(90deg, var(--purple-300), var(--purple-500))', borderRadius: 100 }} />
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--purple-900)', minWidth: 24, textAlign: 'left' }}>{numFmt.format(t.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-promo">
            <h4>أضف مؤسسة جديدة</h4>
            <p>أنشئ مساحة مستقلة لجهة جديدة وحدّد باقتها ومسؤولها.</p>
            <Link href="/admin/organizations/new" className="dash-promo-btn">
              <Icon name="actions/actions-add" size={14} /> إنشاء مؤسسة
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

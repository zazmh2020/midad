import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import {
  canViewReports, projectStatusLabel, programStatusLabel,
  campaignStatusLabel, beneficiaryStatusLabel,
} from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');

/** يحوّل تجميع groupBy إلى خريطة قيمة→عدد */
function toMap<R extends { _count: number }>(rows: R[], keyer: (r: R) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[keyer(r)] = r._count;
  return out;
}

function Distribution({ title, data, label }: { title: string; data: Record<string, number>; label: (k: string) => string }) {
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="org-panel">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="org-panel-sub">لا بيانات بعد.</p>
      ) : (
        <div className="org-dist">
          {entries.map(([k, v]) => (
            <div key={k} className="org-dist-row">
              <span className="org-dist-label">{label(k)}</span>
              <div className="org-dist-bar">
                <span style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
              </div>
              <span className="org-dist-value">{numFmt.format(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function OrgReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewReports(user.role)) redirect(`/org/${org.slug}`);
  const where = { organizationId: org.id };

  const [
    users, activeUsers, departments, programs, beneficiaries, campaigns,
    projByStatus, progByStatus, campByStatus, benByStatus,
    donationCount, receivedAgg,
  ] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, isActive: true } }),
    prisma.department.count({ where }),
    prisma.program.count({ where }),
    prisma.beneficiary.count({ where }),
    prisma.campaign.count({ where }),
    prisma.project.groupBy({ by: ['status'], where, _count: true }),
    prisma.program.groupBy({ by: ['status'], where, _count: true }),
    prisma.campaign.groupBy({ by: ['status'], where, _count: true }),
    prisma.beneficiary.groupBy({ by: ['status'], where, _count: true }),
    prisma.donation.count({ where }),
    prisma.donation.aggregate({ where: { ...where, status: 'RECEIVED' }, _sum: { amount: true } }),
  ]);

  const projectCount = projByStatus.reduce((s, r) => s + r._count, 0);
  const totalReceived = receivedAgg._sum.amount ?? 0;

  const metrics = [
    { label: 'المستخدمون النشطون', value: `${activeUsers} / ${users}` },
    { label: 'الوحدات التنظيمية', value: numFmt.format(departments) },
    { label: 'المشاريع', value: numFmt.format(projectCount) },
    { label: 'البرامج', value: numFmt.format(programs) },
    { label: 'الحملات', value: numFmt.format(campaigns) },
    { label: 'المستفيدون', value: numFmt.format(beneficiaries) },
    { label: 'عمليات التبرع', value: numFmt.format(donationCount) },
    { label: 'إجمالي التبرعات المستلَمة', value: numFmt.format(totalReceived) },
  ];

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">لوحة القياس</span>
          <h1>التقارير والتحليلات</h1>
          <p>قراءة موحّدة لأداء {org.name}.</p>
        </div>
      </div>

      <div className="org-stats">
        {metrics.map((m) => (
          <div key={m.label} className="org-stat">
            <div className="org-stat-label">{m.label}</div>
            <div className="org-stat-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="org-report-grid">
        <Distribution title="المشاريع حسب الحالة" data={toMap(projByStatus, (r) => r.status)} label={projectStatusLabel} />
        <Distribution title="البرامج حسب الحالة" data={toMap(progByStatus, (r) => r.status)} label={programStatusLabel} />
        <Distribution title="الحملات حسب الحالة" data={toMap(campByStatus, (r) => r.status)} label={campaignStatusLabel} />
        <Distribution title="المستفيدون حسب الحالة" data={toMap(benByStatus, (r) => r.status)} label={beneficiaryStatusLabel} />
      </div>
    </div>
  );
}

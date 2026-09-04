import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PLAN_BY_ID, CURRENCY } from '@/lib/plans';
import PlanSelector from './PlanSelector';
import BrandingForm from '@/components/BrandingForm';
import '@/styles/org.css';

const numFmt = new Intl.NumberFormat('en-US');

const typeLabels: Record<string, string> = {
  ASSOCIATION: 'جمعية / مؤسسة',
  MOSQUE: 'مسجد / مركز قرآني',
  SCHOOL: 'مركز تعليمي',
  PROJECT: 'مشروع خاص',
};

export const dynamic = 'force-dynamic';

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      _count: { select: { users: true } },
    },
  });

  if (!org) notFound();

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/organizations" className="link-quiet">← المؤسسات</Link>
          <h1>{org.name}</h1>
          <p>{typeLabels[org.type]}</p>
        </div>
        <span className={`badge ${org.isActive ? 'badge-success' : 'badge-muted'}`}>
          {org.isActive ? 'نشطة' : 'معطّلة'}
        </span>
      </div>

      <div className="section-block">
        <h2>الباقة</h2>
        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-card-label">الباقة الحالية</div>
            <div className="detail-card-value">{PLAN_BY_ID[org.plan]?.name ?? org.plan}</div>
          </div>
          <div className="detail-card">
            <div className="detail-card-label">السعر الشهري</div>
            <div className="detail-card-value">
              {(() => {
                const p = PLAN_BY_ID[org.plan];
                if (!p || p.price === null) return 'مخصّص';
                if (p.price === 0) return 'مجانًا';
                return `${numFmt.format(p.price)} ${CURRENCY}`;
              })()}
            </div>
          </div>
          <div className="detail-card">
            <div className="detail-card-label">حدّ المستخدمين</div>
            <div className="detail-card-value">
              {PLAN_BY_ID[org.plan]?.maxUsers == null ? 'بلا حدّ' : numFmt.format(PLAN_BY_ID[org.plan]!.maxUsers!)}
            </div>
          </div>
        </div>
        <PlanSelector slug={org.slug} current={org.plan} />
      </div>

      <div className="section-block">
        <h2>الهوية البصرية</h2>
        <p className="link-quiet" style={{ marginBottom: '0.8rem' }}>لون هوية الجهة وشعارها — ينعكس على مساحة عملها بالكامل.</p>
        <div style={{ maxWidth: 560 }}>
          <BrandingForm brandColor={org.brandColor} logoUrl={org.logoUrl} apiBase={`/api/admin/organizations/${org.slug}/branding`} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-label">الرابط الفرعي</div>
          <a
            href={`http://${org.slug}.midad.localhost:3000`}
            target="_blank"
            rel="noreferrer"
            className="detail-card-link"
            dir="ltr"
          >
            {org.slug}.midad.localhost:3000 ↗
          </a>
        </div>
        <div className="detail-card">
          <div className="detail-card-label">عدد المستخدمين</div>
          <div className="detail-card-value">{org._count.users}</div>
        </div>
        <div className="detail-card">
          <div className="detail-card-label">تاريخ الإنشاء</div>
          <div className="detail-card-value">
            {new Intl.DateTimeFormat('ar-u-nu-latn', {
              year: 'numeric', month: 'long', day: 'numeric',
            }).format(org.createdAt)}
          </div>
        </div>
      </div>

      <div className="section-block">
        <h2>مستخدمو المؤسسة</h2>
        {org.users.length === 0 ? (
          <p className="empty-hint">لا يوجد مستخدمون بعد.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {org.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td dir="ltr">{u.email}</td>
                    <td>{roleLabel(u.role)}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-muted'}`}>
                        {u.isActive ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function roleLabel(role: string): string {
  return {
    PLATFORM_OWNER: 'مالك المنصة',
    ORG_ADMIN: 'مدير المؤسسة',
    STAFF: 'موظف',
    MEMBER: 'مستخدم',
  }[role] ?? role;
}

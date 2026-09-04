import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = {
  ASSOCIATION: 'جمعية / مؤسسة',
  MOSQUE: 'مسجد / مركز قرآني',
  SCHOOL: 'مركز تعليمي',
  PROJECT: 'مشروع خاص',
};

export default async function OrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>المؤسسات</h1>
          <p>{orgs.length === 0 ? 'لا توجد مؤسسات بعد.' : `${orgs.length} مؤسسة مسجّلة.`}</p>
        </div>
        <Link href="/admin/organizations/new" className="btn-admin-primary">
          + إنشاء مؤسسة
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="empty-state">
          <p>ابدأ بإنشاء أول مؤسسة.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الرابط الفرعي</th>
                <th>المستخدمون</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <strong>{org.name}</strong>
                  </td>
                  <td>{typeLabels[org.type]}</td>
                  <td>
                    <code dir="ltr">{org.slug}.midad.localhost:3000</code>
                  </td>
                  <td>{org._count.users}</td>
                  <td>
                    <span className={`badge ${org.isActive ? 'badge-success' : 'badge-muted'}`}>
                      {org.isActive ? 'نشطة' : 'معطّلة'}
                    </span>
                  </td>
                  <td>
                    {new Intl.DateTimeFormat('ar-u-nu-latn', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }).format(org.createdAt)}
                  </td>
                  <td>
                    <Link href={`/admin/organizations/${org.slug}`} className="link-quiet">
                      إدارة ←
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewHR } from '@/lib/permissions';
import EmployeesView from '@/components/resources/EmployeesView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewHR(user.role)) redirect(`/org/${org.slug}`);

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, email: true, position: true, status: true, departmentId: true },
    }),
    prisma.department.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeRes')}</span>
          <h1>{t('pg.employees.title')}</h1>
          <p>{t('pg.employees.sub', { n: employees.length, org: org.name })}</p>
        </div>
      </div>
      <EmployeesView employees={employees} departments={departments} />
    </div>
  );
}

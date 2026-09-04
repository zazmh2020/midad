import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewHR } from '@/lib/permissions';
import EmployeesView from '@/components/resources/EmployeesView';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
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
          <span className="org-eyebrow">الموارد</span>
          <h1>الموظفون</h1>
          <p>{employees.length} موظف في {org.name}.</p>
        </div>
      </div>
      <EmployeesView employees={employees} departments={departments} />
    </div>
  );
}

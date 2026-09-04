import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewUsers, canManageUsers } from '@/lib/permissions';
import OrgUsersTable from '@/components/OrgUsersTable';

export const dynamic = 'force-dynamic';

export default async function OrgUsersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewUsers(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageUsers(user.role);

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: org.id },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        departmentId: true,
      },
    }),
    prisma.department.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">إدارة الوصول</span>
          <h1>المستخدمون</h1>
          <p>{users.length} حساب في {org.name}.</p>
        </div>
        {canManage && (
          <Link href={`/org/${org.slug}/users/new`} className="org-btn org-btn-primary">
            + إضافة مستخدم
          </Link>
        )}
      </div>

      <OrgUsersTable
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        }))}
        departments={departments}
        currentUserId={user.id}
        canManage={canManage}
      />
    </div>
  );
}

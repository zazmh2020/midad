import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canManageUsers } from '@/lib/permissions';
import NewOrgUserForm from '@/components/NewOrgUserForm';

export const dynamic = 'force-dynamic';

export default async function NewOrgUserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canManageUsers(user.role)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <Link href={`/org/${org.slug}/users`} className="org-back">← المستخدمون</Link>
          <h1>إضافة مستخدم</h1>
          <p>سيُضاف الحساب إلى {org.name} وحدها.</p>
        </div>
      </div>

      <NewOrgUserForm slug={org.slug} />
    </div>
  );
}

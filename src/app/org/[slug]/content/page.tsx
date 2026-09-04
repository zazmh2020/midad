import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageSettings } from '@/lib/permissions';
import ContentView from '@/components/ContentView';
import '@/styles/statistics.css';
import '@/styles/modules.css';

export const dynamic = 'force-dynamic';

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org, user } = await requireOrgAccess(slug);
  const base = `/org/${org.slug}`;

  if (!canManageSettings(user.role)) {
    return (
      <div className="org-page">
        <div className="org-page-head"><div><h1>إدارة المحتوى</h1><p>هذه الصفحة متاحة لمديري المؤسسة فقط.</p></div></div>
      </div>
    );
  }

  const rows = await prisma.announcement.findMany({
    where: { organizationId: org.id },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, title: true, body: true, createdAt: true },
  });
  const announcements = rows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>لوحة التحكم</Link><span>/</span>
        <span className="is-current">إدارة المحتوى</span>
      </nav>
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">المؤسسة</span>
          <h1>إدارة المحتوى</h1>
          <p>انشر الأخبار والإعلانات، وأدر ظهور مؤسستك العام.</p>
        </div>
      </div>
      <ContentView announcements={announcements} />
    </div>
  );
}

import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import CertificatesView from '@/components/CertificatesView';
import '@/styles/statistics.css';
import '@/styles/modules.css';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireOrgAccess(slug);
  const base = `/org/${org.slug}`;

  const rows = await prisma.student.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true,
      halaqa: { select: { name: true } },
      _count: { select: { memorization: true } },
    },
  });
  const students = rows.map((s) => ({ id: s.id, name: s.name, halaqa: s.halaqa?.name ?? null, sessions: s._count.memorization }));

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>لوحة التحكم</Link><span>/</span>
        <Link href={`${base}/education`}>التعليم</Link><span>/</span>
        <span className="is-current">الشهادات</span>
      </nav>
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">التعليم القرآني</span>
          <h1>الشهادات</h1>
          <p>اختر طالبًا لمعاينة شهادته وطباعتها أو حفظها PDF.</p>
        </div>
      </div>
      <CertificatesView students={students} orgName={org.name} />
    </div>
  );
}

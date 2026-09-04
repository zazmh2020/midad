import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import StatisticsView from '@/components/StatisticsView';
import '@/styles/statistics.css';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org } = await requireOrgAccess(slug);
  const base = `/org/${org.slug}`;

  const [halaqat, students] = await Promise.all([
    prisma.halaqa.findMany({ where: { organizationId: org.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.student.findMany({ where: { organizationId: org.id }, select: { id: true, name: true, halaqaId: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>لوحة التحكم</Link>
        <span>/</span>
        <Link href={`${base}/education`}>التعليم</Link>
        <span>/</span>
        <span className="is-current">الإحصاءات</span>
      </nav>

      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">التقارير والمعرفة</span>
          <h1>الإحصاءات — تطوّر الإنجاز</h1>
          <p>تابع جلسات الحفظ والمراجعة عبر الزمن، بفلاتر حسب الحلقة والطالب والفترة.</p>
        </div>
      </div>

      <StatisticsView halaqat={halaqat} students={students} />
    </div>
  );
}

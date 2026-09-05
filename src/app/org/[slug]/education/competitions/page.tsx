import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import CompetitionsView from '@/components/CompetitionsView';
import '@/styles/statistics.css';
import '@/styles/modules.css';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function CompetitionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const base = `/org/${org.slug}`;

  const rows = await prisma.competition.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, level: true, status: true, startDate: true },
  });
  const competitions = rows.map((c) => ({ ...c, startDate: c.startDate ? c.startDate.toISOString() : null }));

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>لوحة التحكم</Link><span>/</span>
        <Link href={`${base}/education`}>التعليم</Link><span>/</span>
        <span className="is-current">المسابقات</span>
      </nav>
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeQuran')}</span>
          <h1>{t('pg.competitions.title')}</h1>
          <p>{t('pg.competitions.sub')}</p>
        </div>
      </div>
      <CompetitionsView competitions={competitions} />
    </div>
  );
}

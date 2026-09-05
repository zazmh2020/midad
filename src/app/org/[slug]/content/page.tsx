import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageSettings } from '@/lib/permissions';
import ContentView from '@/components/ContentView';
import { getT } from '@/lib/i18n/server';
import '@/styles/statistics.css';
import '@/styles/modules.css';

export const dynamic = 'force-dynamic';

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org, user } = await requireOrgAccess(slug);
  const { t } = await getT();
  const base = `/org/${org.slug}`;

  if (!canManageSettings(user.role)) {
    return (
      <div className="org-page">
        <div className="org-page-head"><div><h1>{t('pg.content.title')}</h1><p>{t('pg.content.denied')}</p></div></div>
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
      <nav className="org-crumb" aria-label={t('pg.breadcrumb')}>
        <Link href={base}>{t('onav.dashboard')}</Link><span>/</span>
        <span className="is-current">{t('pg.content.title')}</span>
      </nav>
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeOrg')}</span>
          <h1>{t('pg.content.title')}</h1>
          <p>{t('pg.content.sub')}</p>
        </div>
      </div>
      <ContentView announcements={announcements} slug={org.slug} sitePublished={org.sitePublished} />
    </div>
  );
}

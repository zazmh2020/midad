import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';
import '@/styles/public-site.css';

export const dynamic = 'force-dynamic';

const TYPE_KEY: Record<string, string> = {
  ASSOCIATION: 'atype.ASSOCIATION', MOSQUE: 'atype.MOSQUE', SCHOOL: 'atype.SCHOOL', PROJECT: 'atype.PROJECT',
};

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar', { year: 'numeric', month: 'long', day: 'numeric' });

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { name: true, type: true, brandColor: true, logoUrl: true, sitePublished: true, isActive: true },
  });

  if (!org || !org.isActive || !org.sitePublished) {
    return (
      <main className="ps-empty">
        <div className="ps-empty-card">
          <h1>{t('psite.unavailableTitle')}</h1>
          <p>{t('psite.unavailableBody')}</p>
        </div>
      </main>
    );
  }

  const announcements = await prisma.announcement.findMany({
    where: { organization: { slug } },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 30,
    select: { id: true, title: true, body: true, createdAt: true, pinned: true },
  });

  const brand = org.brandColor || '#6b57a0';

  return (
    <main className="ps" style={{ ['--ps-brand' as string]: brand }}>
      <header className="ps-hero">
        <div className="ps-hero-in">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt="" className="ps-logo" />
          ) : (
            <div className="ps-logo ps-logo-ph">{org.name.slice(0, 1)}</div>
          )}
          <h1>{org.name}</h1>
          <p className="ps-type">{t(TYPE_KEY[org.type] ?? 'atype.ASSOCIATION')}</p>
        </div>
      </header>

      <section className="ps-news">
        <h2>{t('psite.news')}</h2>
        {announcements.length === 0 ? (
          <p className="ps-none">{t('psite.noNews')}</p>
        ) : (
          <div className="ps-news-grid">
            {announcements.map((a) => (
              <article key={a.id} className="ps-card">
                <div className="ps-card-top">
                  {a.pinned && <span className="ps-pin">{t('psite.pinned')}</span>}
                  <time>{dateFmt.format(a.createdAt)}</time>
                </div>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="ps-footer">
        <span>{org.name}</span>
        <span className="ps-by">{t('psite.poweredBy')}</span>
      </footer>
    </main>
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEvents, canManageEvents } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import EventsView from '@/components/EventsView';

export const dynamic = 'force-dynamic';

export default async function OrgEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEvents(user)) redirect(`/org/${org.slug}`);

  const events = await prisma.event.findMany({
    where: { organizationId: org.id },
    orderBy: { startAt: 'asc' },
    select: { id: true, title: true, details: true, location: true, startAt: true, endAt: true },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.corp')}</span>
          <h1>{t('ev.pageTitle')}</h1>
          <p>{t('ev.pageSub', { org: org.name })}</p>
        </div>
      </div>
      <EventsView
        canManage={canManageEvents(user)}
        events={events.map((e) => ({
          id: e.id, title: e.title, details: e.details, location: e.location,
          startAt: e.startAt.toISOString(), endAt: e.endAt ? e.endAt.toISOString() : null,
        }))}
      />
    </div>
  );
}

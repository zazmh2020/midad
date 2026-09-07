import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import MessagesView from '@/components/MessagesView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function MessagesPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const { slug } = await params;
  const { with: withId } = await searchParams;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const me = user.id;

  // أعضاء الجهة (لبدء محادثة) + آخر الرسائل التي تخصّني
  const [members, recent] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: org.id, isActive: true, id: { not: me } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, role: true },
    }),
    prisma.message.findMany({
      where: { organizationId: org.id, OR: [{ senderId: me }, { recipientId: me }] },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true, body: true, senderId: true, recipientId: true, readAt: true, createdAt: true },
    }),
  ]);

  const nameOf = new Map(members.map((m) => [m.id, m.name]));

  // بناء قائمة المحادثات: آخر رسالة + عدد غير المقروء لكل طرف آخر
  const convo = new Map<string, { userId: string; name: string; last: string; at: string; unread: number }>();
  for (const msg of recent) {
    const other = msg.senderId === me ? msg.recipientId : msg.senderId;
    if (!convo.has(other)) {
      convo.set(other, {
        userId: other, name: nameOf.get(other) ?? '—',
        last: msg.body, at: msg.createdAt.toISOString(), unread: 0,
      });
    }
    if (msg.recipientId === me && !msg.readAt) convo.get(other)!.unread += 1;
  }
  const conversations = [...convo.values()];

  // المحادثة النشطة
  const activeId = withId && (nameOf.has(withId) || convo.has(withId)) ? withId : null;
  const thread = activeId
    ? recent
        .filter((m) => (m.senderId === me && m.recipientId === activeId) || (m.senderId === activeId && m.recipientId === me))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((m) => ({ id: m.id, body: m.body, mine: m.senderId === me, at: m.createdAt.toISOString() }))
    : [];

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.div.knowledge')}</span>
          <h1>{t('msg.title')}</h1>
          <p>{t('msg.sub')}</p>
        </div>
      </div>
      <MessagesView
        base={`/org/${org.slug}/messages`}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        conversations={conversations}
        activeId={activeId}
        activeName={activeId ? nameOf.get(activeId) ?? '—' : null}
        thread={thread}
      />
    </div>
  );
}

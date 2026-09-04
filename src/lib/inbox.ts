import { prisma } from '@/lib/prisma';

/* ============================================================
   صندوق الوارد — رسائل (إعلانات الجهة) + إشعارات (نشاط حديث)
   يُحسب من البيانات الفعلية (لا جداول جديدة).
   ============================================================ */

export interface InboxMessage {
  id: string;
  title: string;
  body: string;
  time: string; // ISO
  pinned: boolean;
}

export interface InboxNotification {
  id: string;
  type: 'member' | 'announcement';
  title: string;
  time: string; // ISO
}

export interface OrgInbox {
  messages: InboxMessage[];
  notifications: InboxNotification[];
}

/** صندoق وارد مالك المنصّة — من المؤسسات والمستخدمين الأحدث (بيانات فعلية). */
export async function getAdminInbox(): Promise<OrgInbox> {
  const [orgs, users] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, slug: true, plan: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const messages: InboxMessage[] = orgs.map((o) => ({
    id: o.id,
    title: o.name,
    body: `النطاق: ${o.slug} · الباقة: ${o.plan}`,
    time: o.createdAt.toISOString(),
    pinned: false,
  }));

  const notifications: InboxNotification[] = [
    ...orgs.slice(0, 5).map((o) => ({
      id: `org-${o.id}`,
      type: 'announcement' as const,
      title: `مؤسسة جديدة: ${o.name}`,
      time: o.createdAt.toISOString(),
    })),
    ...users.map((u) => ({
      id: `usr-${u.id}`,
      type: 'member' as const,
      title: `مستخدم جديد: ${u.name}`,
      time: u.createdAt.toISOString(),
    })),
  ]
    .sort((x, y) => (x.time < y.time ? 1 : -1))
    .slice(0, 8);

  return { messages, notifications };
}

export async function getOrgInbox(organizationId: string): Promise<OrgInbox> {
  const [announcements, members] = await Promise.all([
    prisma.announcement.findMany({
      where: { organizationId, isPublished: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 8,
    }),
    prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const messages: InboxMessage[] = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    time: a.createdAt.toISOString(),
    pinned: a.pinned,
  }));

  const notifications: InboxNotification[] = [
    ...announcements.slice(0, 5).map((a) => ({
      id: `ann-${a.id}`,
      type: 'announcement' as const,
      title: `إعلان جديد: ${a.title}`,
      time: a.createdAt.toISOString(),
    })),
    ...members.map((m) => ({
      id: `usr-${m.id}`,
      type: 'member' as const,
      title: `انضمّ ${m.name} إلى الفريق`,
      time: m.createdAt.toISOString(),
    })),
  ]
    .sort((x, y) => (x.time < y.time ? 1 : -1))
    .slice(0, 8);

  return { messages, notifications };
}

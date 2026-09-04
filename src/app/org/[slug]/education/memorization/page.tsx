import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import MemorizationView from '@/components/education/MemorizationView';

export const dynamic = 'force-dynamic';

export default async function MemorizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);

  const [entries, students] = await Promise.all([
    prisma.memorizationEntry.findMany({
      where: { organizationId: org.id },
      orderBy: { date: 'desc' },
      take: 200,
      select: {
        id: true, date: true, kind: true, content: true, rating: true, notes: true,
        student: { select: { name: true } },
      },
    }),
    prisma.student.findMany({ where: { organizationId: org.id, status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">التعليم</span>
          <h1>الحفظ والتسميع</h1>
          <p>{entries.length} سجل تسميع في {org.name}.</p>
        </div>
      </div>
      <MemorizationView
        students={students}
        entries={entries.map((e) => ({
          id: e.id, kind: e.kind, content: e.content, rating: e.rating, notes: e.notes,
          studentName: e.student?.name ?? '—', date: e.date.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}

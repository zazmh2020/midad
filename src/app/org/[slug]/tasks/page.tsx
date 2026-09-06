import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewTasks, canManageTasks } from '@/lib/permissions';
import TasksView from '@/components/TasksView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgTasksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewTasks(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageTasks(user);
  const where = { organizationId: org.id };

  const [tasks, members, departments] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true, title: true, description: true, status: true, priority: true,
        dueDate: true, assigneeId: true, departmentId: true,
        assignee: { select: { name: true } },
      },
    }),
    prisma.user.findMany({ where: { ...where, isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.department.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.corp')}</span>
          <h1>{t('hub.ops.tasks')}</h1>
          <p>{t('task.count', { n: tasks.length, org: org.name })}</p>
        </div>
      </div>

      <TasksView
        canManage={canManage}
        members={members}
        departments={departments}
        tasks={tasks.map((tk) => ({
          id: tk.id,
          title: tk.title,
          description: tk.description,
          status: tk.status,
          priority: tk.priority,
          dueDate: tk.dueDate ? tk.dueDate.toISOString().slice(0, 10) : null,
          assigneeId: tk.assigneeId,
          assigneeName: tk.assignee?.name ?? null,
          departmentId: tk.departmentId,
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewKnowledge, canManageKnowledge } from '@/lib/permissions';
import KnowledgeView from '@/components/KnowledgeView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgKnowledgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewKnowledge(user.role)) redirect(`/org/${org.slug}`);
  const canManage = canManageKnowledge(user.role);

  // غير المديرين يرون المنشور فقط
  const articles = await prisma.knowledgeArticle.findMany({
    where: { organizationId: org.id, ...(canManage ? {} : { isPublished: true }) },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, title: true, body: true, category: true, isPublished: true, updatedAt: true,
      author: { select: { name: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.units')}</span>
          <h1>{t('onav.knowledge')}</h1>
          <p>{t('know.count', { n: articles.length, org: org.name })}</p>
        </div>
      </div>

      <KnowledgeView
        canManage={canManage}
        articles={articles.map((a) => ({
          id: a.id, title: a.title, body: a.body, category: a.category, isPublished: a.isPublished,
          author: a.author?.name ?? null, updatedAt: a.updatedAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewDocuments, canManageDocuments } from '@/lib/permissions';
import { isS3Configured } from '@/lib/s3';
import DocumentsView from '@/components/DocumentsView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgDocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewDocuments(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageDocuments(user);

  const [documents, departments] = await Promise.all([
    prisma.document.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, description: true, category: true, fileName: true,
        contentType: true, size: true, departmentId: true, createdAt: true,
        uploadedBy: { select: { name: true } },
      },
    }),
    prisma.department.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.units')}</span>
          <h1>{t('docs.title')}</h1>
          <p>{t('docs.count', { n: documents.length, org: org.name })}</p>
        </div>
      </div>

      <DocumentsView
        canManage={canManage}
        storageReady={isS3Configured()}
        departments={departments}
        documents={documents.map((d) => ({
          id: d.id, name: d.name, description: d.description, category: d.category,
          fileName: d.fileName, contentType: d.contentType, size: d.size,
          departmentId: d.departmentId, uploadedBy: d.uploadedBy?.name ?? null,
          createdAt: d.createdAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}

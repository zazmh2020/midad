import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canViewHR } from '@/lib/permissions';
import VerifyTool from '@/components/VerifyTool';
import { getT } from '@/lib/i18n/server';
import '@/styles/cards.css';

export const dynamic = 'force-dynamic';

export default async function VerifyToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewHR(user.role)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.identity')}</span>
          <h1>{t('verifyTool.pageTitle')}</h1>
          <p>{t('verifyTool.pageSub')}</p>
        </div>
      </div>
      <VerifyTool />
    </div>
  );
}

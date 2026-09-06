import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canUseAssistant } from '@/lib/permissions';
import { isAssistantConfigured } from '@/lib/anthropic';
import AssistantChat from '@/components/AssistantChat';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgAssistantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canUseAssistant(user)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('brand')}</span>
          <h1>{t('pg.assistant.title')}</h1>
          <p>{t('pg.assistant.sub', { org: org.name })}</p>
        </div>
      </div>

      <AssistantChat ready={isAssistantConfigured()} />
    </div>
  );
}

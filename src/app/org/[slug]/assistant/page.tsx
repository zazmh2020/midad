import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canUseAssistant } from '@/lib/permissions';
import { isAssistantConfigured } from '@/lib/anthropic';
import AssistantChat from '@/components/AssistantChat';

export const dynamic = 'force-dynamic';

export default async function OrgAssistantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canUseAssistant(user.role)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">مِداد</span>
          <h1>المساعد الذكي</h1>
          <p>اسأل عن بيانات {org.name}؛ يجيب ضمن حدود ما يحقّ لك الاطّلاع عليه.</p>
        </div>
      </div>

      <AssistantChat ready={isAssistantConfigured()} />
    </div>
  );
}

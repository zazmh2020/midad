import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import { PLANS, CURRENCY } from '@/lib/plans';
import { billingConfigured } from '@/lib/stripe';
import BillingView from '@/components/BillingView';

export const dynamic = 'force-dynamic';

export default async function BillingPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  if (!canManageSettings(user.role)) redirect(`/org/${org.slug}`);

  const plans = PLANS.map((p) => ({
    id: p.id,
    name: locale === 'en' ? p.en : p.name,
    price: p.price,
    paid: p.price != null && p.price > 0,
    current: org.plan === p.id,
  }));

  const statusMsg = sp.status === 'success' ? 'success' : sp.status === 'cancel' ? 'cancel' : null;

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeSystem')}</span>
          <h1>{t('bill.title')}</h1>
          <p>{t('bill.sub')}</p>
        </div>
      </div>
      <BillingView
        plans={plans}
        statusMsg={statusMsg as 'success' | 'cancel' | null}
        configured={billingConfigured()}
        subscriptionStatus={org.subscriptionStatus}
        renewsAt={org.planRenewsAt ? org.planRenewsAt.toISOString() : null}
        currency={CURRENCY}
      />
    </div>
  );
}

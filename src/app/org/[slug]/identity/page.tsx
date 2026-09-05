import { requireOrgAccess } from '@/lib/org';
import { canViewHR } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function IdentityHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const base = `/org/${org.slug}`;
  const canCards = canViewHR(user.role);

  const items: HubItem[] = [
    { title: t('hub.id.cards'), desc: t('hub.id.cards.d'), ...(canCards ? { href: `${base}/identity/cards` } : {}) },
    { title: t('hub.id.qr'), desc: t('hub.id.qr.d'), ...(canCards ? { href: `${base}/identity/cards` } : {}) },
    { title: t('hub.id.verify'), desc: t('hub.id.verify.d'), ...(canCards ? { href: `${base}/identity/verify` } : {}) },
    { title: t('hub.id.nfc'), desc: t('hub.id.nfc.d'), ...(canCards ? { href: `${base}/identity/verify` } : {}) },
  ];

  return (
    <SectionHub
      eyebrow={t('onav.div.knowledge')}
      title={t('onav.identity')}
      intro={t('hub.id.intro')}
      items={items}
    />
  );
}

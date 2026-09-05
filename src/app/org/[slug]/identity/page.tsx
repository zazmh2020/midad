import { requireOrgAccess } from '@/lib/org';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function IdentityHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireOrgAccess(slug);
  const { t } = await getT();

  const items: HubItem[] = [
    { title: t('hub.id.cards'), desc: t('hub.id.cards.d') },
    { title: t('hub.id.qr'), desc: t('hub.id.qr.d') },
    { title: t('hub.id.nfc'), desc: t('hub.id.nfc.d') },
    { title: t('hub.id.verify'), desc: t('hub.id.verify.d') },
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

import { requireOrgAccess } from '@/lib/org';
import SectionHub, { type HubItem } from '@/components/SectionHub';

export const dynamic = 'force-dynamic';

export default async function IdentityHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireOrgAccess(slug);

  const items: HubItem[] = [
    { title: 'البطاقات الرقمية', desc: 'بطاقات هوية رقمية للأعضاء والمستفيدين.' },
    { title: 'رمز QR', desc: 'توليد رموز QR للتحقق السريع.' },
    { title: 'NFC', desc: 'دعم بطاقات NFC مستقبلًا.' },
    { title: 'التحقق من الهوية', desc: 'التأكّد من هوية الأعضاء والمستفيدين.' },
  ];

  return (
    <SectionHub
      eyebrow="المعرفة والذكاء"
      title="الهوية الرقمية"
      intro="نظام الهويّات والبطاقات الرقمية — قيد الإعداد."
      items={items}
    />
  );
}

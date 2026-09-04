import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import Icon from '@/components/Icon';
import HubBrowser, { type HubItem } from '@/components/HubBrowser';
import '@/styles/statistics.css';
import '@/styles/modules.css';

export const dynamic = 'force-dynamic';

interface Plan {
  id: string; icon: string; title: string; subtitle: string; tag: string;
  desc: string; kpis: [string, string][]; stages: { n: string; t: string; d: string; meta: string }[];
}

const PLANS: Plan[] = [
  {
    id: 'full', icon: 'education/education-quran', title: 'خطة الحفظ الكامل', subtitle: '٣٠ جزءًا · ٣ سنوات', tag: 'شاملة',
    desc: 'مسار متدرّج لحفظ القرآن كاملًا مع التثبيت والمراجعة الدورية.',
    kpis: [['المدة', '٣ سنوات'], ['الأجزاء', '30'], ['الحصص/أسبوع', '5']],
    stages: [
      { n: '1', t: 'التأسيس', d: 'جزء عمّ + تبارك', meta: '4 أشهر' },
      { n: '2', t: 'المتوسط', d: 'من الذاريات إلى المجادلة', meta: '10 أشهر' },
      { n: '3', t: 'المتقدّم', d: 'بقية الأجزاء مع التثبيت', meta: '16 شهرًا' },
      { n: '4', t: 'الختم والإجازة', d: 'مراجعة شاملة وتقييم نهائي', meta: '6 أشهر' },
    ],
  },
  {
    id: 'juz30', icon: 'education/education-learning', title: 'خطة جزء عمّ', subtitle: 'للمبتدئين · 4 أشهر', tag: 'مبتدئ',
    desc: 'مدخل مثالي للناشئة لبناء عادة الحفظ من السور القصيرة.',
    kpis: [['المدة', '4 أشهر'], ['السور', '37'], ['الحصص/أسبوع', '3']],
    stages: [
      { n: '1', t: 'قصار السور', d: 'من الناس إلى الضحى', meta: '6 أسابيع' },
      { n: '2', t: 'الوسط', d: 'من الليل إلى النبأ', meta: '6 أسابيع' },
      { n: '3', t: 'التثبيت', d: 'مراجعة الجزء كاملًا', meta: '4 أسابيع' },
    ],
  },
  {
    id: 'mufassal', icon: 'education/education-courses', title: 'خطة المفصّل', subtitle: 'من ق إلى الناس · 8 أشهر', tag: 'متوسط',
    desc: 'حفظ المفصّل بأقسامه الثلاثة (الطوال والأوساط والقصار).',
    kpis: [['المدة', '8 أشهر'], ['الأجزاء', '7'], ['الحصص/أسبوع', '4']],
    stages: [
      { n: '1', t: 'طوال المفصّل', d: 'من ق إلى المرسلات', meta: '3 أشهر' },
      { n: '2', t: 'أوساط المفصّل', d: 'من النبأ إلى الضحى', meta: '3 أشهر' },
      { n: '3', t: 'قصار المفصّل', d: 'من الشرح إلى الناس', meta: 'شهران' },
    ],
  },
  {
    id: 'review', icon: 'operations/operations-progress', title: 'خطة المراجعة', subtitle: 'تثبيت المحفوظ · مستمرة', tag: 'مستمرة',
    desc: 'دورة مراجعة منتظمة تحافظ على المحفوظ وتقيس التثبيت.',
    kpis: [['الدورة', 'أسبوعية'], ['الورد', 'حزب/يوم'], ['التقييم', 'شهري']],
    stages: [
      { n: '1', t: 'الورد اليومي', d: 'مراجعة حزب مع المعلّم', meta: 'يوميًا' },
      { n: '2', t: 'التسميع الأسبوعي', d: 'عرض 5 أجزاء', meta: 'أسبوعيًا' },
      { n: '3', t: 'التقييم الشهري', d: 'اختبار تثبيت شامل', meta: 'شهريًا' },
    ],
  },
  {
    id: 'tajweed', icon: 'education/education-lessons', title: 'خطة التجويد', subtitle: 'الأحكام العملية · 3 أشهر', tag: 'مهارة',
    desc: 'إتقان أحكام التلاوة تطبيقيًا مع مخارج الحروف والصفات.',
    kpis: [['المدة', '3 أشهر'], ['الأحكام', '12'], ['الحصص/أسبوع', '2']],
    stages: [
      { n: '1', t: 'المخارج والصفات', d: 'أساس النطق السليم', meta: '4 أسابيع' },
      { n: '2', t: 'أحكام النون والميم', d: 'إظهار وإدغام وإخفاء', meta: '4 أسابيع' },
      { n: '3', t: 'المدود والتطبيق', d: 'تلاوة مُتقنة', meta: '4 أسابيع' },
    ],
  },
];

export default async function PlansPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireOrgAccess(slug);
  const base = `/org/${org.slug}`;

  const items: HubItem[] = PLANS.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    tag: p.tag,
    tagKind: 'muted',
    icon: <Icon name={p.icon} size={18} />,
    detail: (
      <div className="mod-detail">
        <div className="mod-detail-hd">
          <span className="mod-detail-ic"><Icon name={p.icon} size={22} /></span>
          <div><h3>{p.title}</h3><p>{p.desc}</p></div>
        </div>
        <div className="mod-kpis">
          {p.kpis.map(([k, v]) => (
            <div key={k} className="mod-kpi"><div className="k">{k}</div><div className="v">{v}</div></div>
          ))}
        </div>
        <div className="mod-stages">
          {p.stages.map((s) => (
            <div key={s.n} className="mod-stage">
              <span className="mod-stage-n">{s.n}</span>
              <span className="mod-stage-tx"><strong>{s.t}</strong><span>{s.d}</span></span>
              <span className="mod-stage-meta">{s.meta}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  }));

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>لوحة التحكم</Link><span>/</span>
        <Link href={`${base}/education`}>التعليم</Link><span>/</span>
        <span className="is-current">الخطط والمقرّرات</span>
      </nav>
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">التعليم القرآني</span>
          <h1>الخطط والمقرّرات</h1>
          <p>اختر خطة لعرض مراحلها ومقرّراتها — فعّلها لأي حلقة أو طالب.</p>
        </div>
      </div>
      <HubBrowser items={items} />
    </div>
  );
}

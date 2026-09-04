'use client';

import Reveal from '@/components/Reveal';
import Mockup, { type MockKind } from './Mockup';

interface Item {
  kind: MockKind;
  t: string;
  d: string;
  points: string[];
}

const ITEMS: Item[] = [
  { kind: 'dashboard', t: 'لوحة تحكم شاملة', d: 'نظرة واحدة على مؤسستك: المؤشرات والنشاط والتقدّم لحظةً بلحظة.', points: ['مؤشرات أداء مباشرة', 'نشاط ورسوم بيانية', 'وصول سريع لكل الأنظمة'] },
  { kind: 'hr', t: 'الموظفون والمتطوعون', d: 'ملفات كاملة للموظفين والمتطوعين والفرق والصلاحيات.', points: ['ملفات وعقود', 'فرق وأقسام', 'صلاحيات دقيقة'] },
  { kind: 'projects', t: 'المشاريع والبرامج', d: 'خطط ومهام ومراحل تنفيذ ومتابعة إنجاز في لوحة واحدة.', points: ['متابعة نسب الإنجاز', 'توزيع المهام', 'تنبيهات التأخير'] },
  { kind: 'education', t: 'البرامج والتعليم', d: 'حلقات وطلاب وحضور وتقدّم حفظ وتقييم مترابط.', points: ['حلقات وطلاب', 'حضور وتقييم', 'تقدّم الحفظ'] },
  { kind: 'beneficiaries', t: 'المستفيدون', d: 'سجل الحالات والخدمات المقدَّمة بمستويات وصول آمنة.', points: ['سجل الحالات', 'الخدمات المقدَّمة', 'وصول محمي'] },
  { kind: 'reports', t: 'التقارير والتحليلات', d: 'حوّل بياناتك إلى رؤى واضحة تدعم قرارك.', points: ['رسوم تفاعلية', 'مؤشرات مخصّصة', 'تصدير ومشاركة'] },
];

const CHECK = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
);

export default function ProductShowcase() {
  return (
    <div className="mdl-shows">
      {ITEMS.map((it, i) => (
        <Reveal key={it.t} y={28}>
          {/* صفوف متبادلة: نقطة يمين/صورة يسار، ثم العكس */}
          <div className={`mdl-show-row ${i % 2 ? 'rev' : ''}`}>
            <div className="mdl-show-text">
              <span className="mdl-sd-badge">{String(i + 1).padStart(2, '0')}</span>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
              <ul>{it.points.map((p) => <li key={p}>{CHECK}<span>{p}</span></li>)}</ul>
            </div>
            <div className="mdl-show-media">
              <Mockup kind={it.kind} />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

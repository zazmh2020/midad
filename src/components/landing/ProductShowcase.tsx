'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="mdl-sd">
      <div className="mdl-sd-text">
        {ITEMS.map((it, i) => (
          <div
            key={it.t}
            data-idx={i}
            ref={(el) => { refs.current[i] = el; }}
            className={`mdl-sd-block ${i === active ? 'is-active' : ''}`}
          >
            <span className="mdl-sd-badge">{String(i + 1).padStart(2, '0')}</span>
            <h3>{it.t}</h3>
            <p>{it.d}</p>
            <ul>{it.points.map((p) => <li key={p}>{CHECK}<span>{p}</span></li>)}</ul>
            {/* نسخة مضمّنة للجوال */}
            <div className="mdl-sd-inline"><Mockup kind={it.kind} /></div>
          </div>
        ))}
      </div>

      <div className="mdl-sd-stage">
        <div className="mdl-sd-sticky">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <Mockup kind={ITEMS[active].kind} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

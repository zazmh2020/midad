'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Mockup, { type MockKind } from './Mockup';

const STEPS: { t: string; d: string; kind: MockKind }[] = [
  { t: 'أنشئ مؤسستك', d: 'ابدأ بإعداد بيانات المؤسسة وهيكلها الإداري.', kind: 'org' },
  { t: 'فعّل الأنظمة', d: 'اختر الوحدات التي تحتاجها فقط، والباقي يبقى مطفأً.', kind: 'dashboard' },
  { t: 'أدر أعمالك', d: 'أدر الموظفين والمشاريع والبرامج والمستفيدين.', kind: 'projects' },
  { t: 'تابع الأداء', d: 'راقب مؤشرات الأداء والتقارير لحظةً بلحظة.', kind: 'reports' },
  { t: 'اتخذ قرارات أذكى', d: 'استخدم التحليلات والذكاء الاصطناعي لدعم القرار.', kind: 'ai' },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActive(idx);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="mdl-tl">
      <div className="mdl-steps">
        {STEPS.map((s, i) => (
          <div
            key={s.t}
            data-idx={i}
            ref={(el) => { refs.current[i] = el; }}
            className={`mdl-step ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="mdl-step-dot">{String(i + 1).padStart(2, '0')}</span>
            <div className="mdl-step-body">
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mdl-tl-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Mockup kind={STEPS[active].kind} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

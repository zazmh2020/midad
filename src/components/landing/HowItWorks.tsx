'use client';

import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';

const STEPS: { t: string; d: string; icon: string }[] = [
  { t: 'أنشئ مؤسستك', d: 'ابدأ بإعداد بيانات المؤسسة وهيكلها الإداري.', icon: 'organization/organization-institution' },
  { t: 'فعّل الأنظمة', d: 'اختر الوحدات التي تحتاجها فقط، والباقي يبقى مطفأً.', icon: 'operations/operations-activities' },
  { t: 'أدر أعمالك', d: 'أدر الموظفين والمشاريع والبرامج والمستفيدين.', icon: 'operations/operations-projects' },
  { t: 'تابع الأداء', d: 'راقب مؤشرات الأداء والتقارير لحظةً بلحظة.', icon: 'analytics/analytics-analytics' },
  { t: 'اتخذ قرارات أذكى', d: 'استخدم التحليلات والذكاء الاصطناعي لدعم القرار.', icon: 'ai/ai-ai-assistant' },
];

export default function HowItWorks() {
  return (
    <div className="mdl-steps-grid">
      {STEPS.map((s, i) => (
        <Reveal key={s.t} delay={i * 0.06} y={24}>
          <div className="mdl-stepc">
            <div className="mdl-stepc-top">
              <span className="mdl-stepc-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="mdl-stepc-ic"><Icon name={s.icon} size={20} /></span>
            </div>
            <h4>{s.t}</h4>
            <p>{s.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

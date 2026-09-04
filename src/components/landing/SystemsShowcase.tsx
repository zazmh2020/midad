'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';
import Mockup, { type MockKind } from './Mockup';

interface Sys {
  icon: string;
  label: string;
  desc: string;
  kind: MockKind;
  cat: string;
  flag?: string;
}

const SYSTEMS: Sys[] = [
  { icon: 'organization/organization-institution', label: 'إدارة المؤسسة', desc: 'الهيكل الإداري والإدارات والأقسام والفروع في مكان واحد.', kind: 'org', cat: 'الإدارة' },
  { icon: 'people/people-employees', label: 'الموارد البشرية', desc: 'ملفات الموظفين والعقود والفرق والصلاحيات.', kind: 'hr', cat: 'الموارد' },
  { icon: 'people/people-volunteers', label: 'الموظفون والمتطوعون', desc: 'إدارة المتطوعين والمهام والحضور بسهولة.', kind: 'people', cat: 'الموارد' },
  { icon: 'operations/operations-projects', label: 'المشاريع والبرامج', desc: 'خطط ومهام ومراحل تنفيذ ومتابعة إنجاز لحظية.', kind: 'projects', cat: 'العمليات' },
  { icon: 'people/people-beneficiaries', label: 'المستفيدون', desc: 'سجل الحالات والخدمات المقدَّمة بمستويات وصول آمنة.', kind: 'beneficiaries', cat: 'العمليات' },
  { icon: 'education/education-education', label: 'التعليم والبرامج', desc: 'حلقات وطلاب وحضور وتقدّم حفظ وتقييم.', kind: 'education', cat: 'التعليم', flag: 'جديد' },
  { icon: 'finance/finance-donations', label: 'المالية والتبرعات', desc: 'حملات ومتبرعون وعمليات مالية جاهزة للربط.', kind: 'finance', cat: 'المالية' },
  { icon: 'analytics/analytics-analytics', label: 'التقارير والتحليلات', desc: 'مؤشرات ورسوم بيانية تُبنى من بياناتك مباشرة.', kind: 'reports', cat: 'التحليلات' },
  { icon: 'documents/documents-documents', label: 'إدارة الوثائق', desc: 'سياسات ونماذج وأرشيف قابل للبحث والاسترجاع.', kind: 'documents', cat: 'الوثائق' },
  { icon: 'ai/ai-ai-assistant', label: 'مِداد AI', desc: 'مساعد ذكي يجيب ويحلّل ضمن حدود صلاحياتك.', kind: 'ai', cat: 'الذكاء الاصطناعي', flag: 'جديد' },
];

export default function SystemsShowcase() {
  const [active, setActive] = useState(3);
  const sys = SYSTEMS[active];

  return (
    <div className="mdl-sys">
      <div className="mdl-sys-list" role="tablist">
        {SYSTEMS.map((s, i) => (
          <button
            key={s.label}
            role="tab"
            aria-selected={i === active}
            className={`mdl-sys-item ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
          >
            <span className="mdl-sys-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="mdl-sys-ic"><Icon name={s.icon} size={18} /></span>
            <span className="mdl-sys-label">
              {s.label}
              <span className="mdl-sys-cat">{s.cat}</span>
            </span>
            {s.flag && <span className="mdl-sys-flag">{s.flag}</span>}
          </button>
        ))}
      </div>

      <div className="mdl-sys-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Mockup kind={sys.kind} />
          </motion.div>
        </AnimatePresence>
        <div className="mdl-sys-desc">
          <Icon name={sys.icon} size={18} />
          <span>{sys.desc}</span>
        </div>
      </div>
    </div>
  );
}

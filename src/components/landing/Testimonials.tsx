'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Story {
  stat: string; unit: string; quote: string; name: string; role: string; org: string;
}

const STORIES: Story[] = [
  { stat: '85%', unit: 'تقليل زمن إعداد التقارير', quote: 'صار كل شيء في مكان واحد — التقارير تُبنى تلقائيًا بدل يومين عمل كل شهر.', name: 'أحمد الخالد', role: 'مدير المشاريع', org: 'جمعية البِر الخيرية' },
  { stat: '6 ساعات', unit: 'توفير أسبوعيًا لكل منسّق', quote: 'مِداد نظّمت فوضى الجداول والملفات في منظومة واحدة مترابطة يسهل تتبّعها.', name: 'سارة المطيري', role: 'منسّقة برامج', org: 'مركز نماء التنموي' },
  { stat: '1,200', unit: 'مستفيد بسجلّ موحّد', quote: 'رؤية كاملة على المستفيدين والخدمات، بصلاحيات دقيقة تحمي كل ملف.', name: 'يوسف العتيبي', role: 'مدير المستفيدين', org: 'مؤسسة عطاء الإنسانية' },
  { stat: '32', unit: 'حلقة تُدار بلا ورق', quote: 'الحضور والتسميع وتطوّر الحفظ — كلها لحظية أمام المشرفين والأولياء.', name: 'خالد الزهراني', role: 'المشرف العام', org: 'مركز أهل القرآن' },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % STORIES.length), 5200);
    return () => clearInterval(t);
  }, [paused]);

  const s = STORIES[i];

  return (
    <div className="mdl-stories" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mdl-stories-stage">
        <AnimatePresence mode="wait">
          <motion.article
            key={i}
            className="mdl-story"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="mdl-story-body">
              <div className="mdl-story-stat">{s.stat}<span>{s.unit}</span></div>
              <p className="mdl-story-quote">”{s.quote}“</p>
              <div className="mdl-story-author">
                <span className="mdl-story-av">{s.name.charAt(0)}</span>
                <span><strong>{s.name}</strong><span>{s.role} · {s.org}</span></span>
              </div>
            </div>
            <div className="mdl-story-emblem">
              <span className="mdl-story-org-mark">{s.org.charAt(0)}</span>
              <span className="mdl-story-org-name">{s.org}</span>
              <svg className="mdl-story-quotemark" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M17 8c-6 2-9 7-9 14v10h11V20h-6c0-4 2-7 6-8zM38 8c-6 2-9 7-9 14v10h11V20h-6c0-4 2-7 6-8z"/></svg>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* شريط القصص القابل للاختيار */}
      <div className="mdl-stories-nav">
        {STORIES.map((st, idx) => (
          <button
            key={st.org}
            className={`mdl-story-chip ${idx === i ? 'is-active' : ''}`}
            onClick={() => setI(idx)}
            aria-label={st.org}
          >
            <span className="mdl-story-chip-av">{st.name.charAt(0)}</span>
            <span className="mdl-story-chip-org">{st.org}</span>
          </button>
        ))}
      </div>

      <div className="mdl-stories-dots">
        {STORIES.map((_, idx) => (
          <button key={idx} className={idx === i ? 'is-active' : ''} onClick={() => setI(idx)} aria-label={`القصة ${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}

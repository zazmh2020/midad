'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** عرض محادثة يحاكي مساعد مِداد الذكي: سؤال → تحليل → إجابة بمؤشرات. */
export default function MidadAIChat() {
  const [stage, setStage] = useState(0); // 0 user, 1 typing, 2 answer
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          setTimeout(() => setStage(1), 800);
          setTimeout(() => setStage(2), 2400);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="mdl-chat" ref={ref}>
      <div className="mdl-chat-head">
        <span className="ava">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /></svg>
        </span>
        <div>
          <b>مِداد AI</b><br />
          <span>مساعدك الذكي</span>
        </div>
      </div>

      <div className="mdl-msgs">
        <motion.div className="mdl-msg user" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          كيف كان أداء المشاريع هذا الشهر؟
        </motion.div>

        <AnimatePresence mode="wait">
          {stage === 1 && (
            <motion.div key="typing" className="mdl-msg ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="mdl-typing"><i /><i /><i /></span>
            </motion.div>
          )}
          {stage === 2 && (
            <motion.div key="answer" className="mdl-msg ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              أنجزت مؤسستك <strong style={{ color: '#C4B3D9' }}>٨٦٪</strong> من مشاريع هذا الشهر. هذه أبرز المؤشرات:
              <div className="ai-metrics">
                <div className="ai-metric"><div className="m">نسبة الإنجاز</div><div className="n">86%</div></div>
                <div className="ai-metric"><div className="m">مشاريع متأخرة</div><div className="n">2</div></div>
                <div className="ai-metric"><div className="m">الأفضل أداءً</div><div className="n">التمكين</div></div>
                <div className="ai-metric"><div className="m">توصية</div><div className="n">مراجعة الحملة</div></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

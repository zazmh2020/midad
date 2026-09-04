'use client';

import { useEffect, useState } from 'react';

/** بطاقة عائمة للتعريف بالمنصة — قابلة للإغلاق (تُحفظ في المتصفح). */
export default function MidadTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem('midad_tour_dismissed') === '1';
    } catch {
      dismissed = false;
    }
    if (!dismissed) {
      const t = setTimeout(() => setShow(true), 1400);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem('midad_tour_dismissed', '1');
    } catch {
      /* تجاهل */
    }
  }

  if (!show) return null;

  return (
    <div className="mdl-tour" role="complementary">
      <button className="mdl-tour-x" onClick={dismiss} aria-label="إغلاق">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
      </button>
      <div className="mdl-tour-badge">جديد في مِداد؟</div>
      <p className="mdl-tour-title">شاهد كيف تدير مؤسستك بالكامل من مكان واحد.</p>
      <a href="#systems" className="mdl-tour-cta" onClick={() => setShow(false)}>
        <span className="mdl-tour-play">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l10 6-10 6z" /></svg>
        </span>
        <span>ابدأ الجولة</span>
      </a>
    </div>
  );
}

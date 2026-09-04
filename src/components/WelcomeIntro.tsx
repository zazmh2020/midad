'use client';

import { useEffect, useState } from 'react';
import '@/styles/intro.css';

/**
 * مقدّمة ترحيبية تظهر مرّة واحدة فقط لأول زيارة، ثم تتلاشى.
 * تُخزَّن في localStorage فلا تتكرّر مع كل تحديث أو زيارة.
 */
export default function WelcomeIntro() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem('midad_intro_seen') === '1';
    } catch {
      seen = false;
    }
    if (seen) return;

    // ثبّت العلامة فورًا حتى لا تظهر المقدّمة مجددًا مع أي تحديث لاحق
    try {
      localStorage.setItem('midad_intro_seen', '1');
    } catch {
      /* تجاهل */
    }

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const hold = reduce ? 700 : 2100;
    let leaveT: ReturnType<typeof setTimeout>;
    let doneT: ReturnType<typeof setTimeout>;

    const raf = requestAnimationFrame(() => {
      setShow(true);
      leaveT = setTimeout(() => setLeaving(true), hold);
      doneT = setTimeout(() => setShow(false), hold + 650);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(leaveT);
      clearTimeout(doneT);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`intro ${leaving ? 'is-leaving' : ''}`}
      role="presentation"
      onClick={() => setLeaving(true)}
    >
      <div className="intro-glow intro-glow-1" />
      <div className="intro-glow intro-glow-2" />

      <div className="intro-stage">
        <div className="intro-mark">
          <span className="intro-mark-ar">مِداد</span>
        </div>
        <div className="intro-line" />
        <p className="intro-tagline">من التقنية إلى الأثر</p>
      </div>
    </div>
  );
}

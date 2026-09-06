'use client';

import { useEffect, useState } from 'react';
import '@/styles/intro.css';

/**
 * مقدّمة ترحيبية تظهر عند كل دخول للموقع ثم تتلاشى تلقائيًا،
 * أو تُغلق فورًا عند النقر. تبدأ ظاهرة لتفادي وميض المحتوى خلفها.
 */
export default function WelcomeIntro() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const hold = reduce ? 700 : 2100;
    const leaveT = setTimeout(() => setLeaving(true), hold);
    const doneT = setTimeout(() => setShow(false), hold + 650);

    return () => {
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

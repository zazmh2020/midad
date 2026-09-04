'use client';

import { useEffect, useState } from 'react';

/** زر تبديل الوضع الفاتح/الداكن — يحفظ الاختيار في localStorage. */
export default function ThemeToggle({ className = '', onDeep = false }: { className?: string; onDeep?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setDark(document.documentElement.dataset.theme === 'dark');
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('midad_theme', next ? 'dark' : 'light'); } catch { /* تجاهل */ }
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${onDeep ? 'on-deep' : ''} ${className}`}
      onClick={toggle}
      aria-label={dark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      suppressHydrationWarning
    >
      {ready && dark ? (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="4" />
          <path d="M10 1v2M10 17v2M1 10h2M17 10h2M4 4l1.5 1.5M14.5 14.5L16 16M4 16l1.5-1.5M14.5 5.5L16 4" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5z" />
        </svg>
      )}
    </button>
  );
}

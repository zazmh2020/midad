'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirFor, type Locale } from './config';
import { translate } from './dictionaries';

interface LocaleContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** النطاق الأب (آخر جزأين) لمشاركة الكوكي عبر النطاقات الفرعية.
 *  يُتجاهَل للنطاقات العامة (vercel.app…) لأن المتصفح يرفض ضبطها. */
function shareableDomain(): string | undefined {
  const host = window.location.hostname;
  if (/^\d+(\.\d+){3}$/.test(host)) return undefined; // IP
  const parts = host.split('.');
  if (parts.length < 2) return undefined; // localhost وحده
  const base = parts.slice(-2).join('.');
  // نطاقات استضافة عامة — لا يمكن ضبط كوكي على نطاقها الأب
  const PUBLIC_SUFFIXES = ['vercel.app', 'netlify.app', 'github.io', 'pages.dev', 'onrender.com'];
  if (PUBLIC_SUFFIXES.includes(base)) return undefined;
  return base;
}

/** يحفظ اللغة في الكوكي + التخزين المحلي ويعيد التحميل لتطبيقها على كل الصفحة.
 *  نضبط كوكي على المضيف نفسه (مضمون دائمًا) + كوكي على النطاق الأب عند إمكانه
 *  (للمشاركة بين النطاقات الفرعية مثل admin.* و<slug>.*). */
export function persistLocale(next: Locale) {
  try {
    const opts = `path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${LOCALE_COOKIE}=${next}; ${opts}`; // host-only (يعمل دائمًا)
    const domain = shareableDomain();
    if (domain) document.cookie = `${LOCALE_COOKIE}=${next}; ${opts}; domain=${domain}`;
    localStorage.setItem(LOCALE_COOKIE, next);
  } catch {
    /* تجاهل */
  }
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    window.location.reload();
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: initialLocale,
      dir: dirFor(initialLocale),
      t: (key, vars) => translate(initialLocale, key, vars),
      setLocale,
    }),
    [initialLocale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // احتياط إن استُخدم خارج الموفّر
  return {
    locale: DEFAULT_LOCALE,
    dir: dirFor(DEFAULT_LOCALE),
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    setLocale: () => {},
  };
}

/** اختصار للحصول على دالة الترجمة فقط. */
export function useT() {
  return useLocale().t;
}

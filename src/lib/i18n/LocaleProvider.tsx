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

/** النطاق الأب (آخر جزأين) ليعمل الكوكي عبر النطاقات الفرعية مثل الجلسة. */
function baseDomain(): string | undefined {
  const parts = window.location.hostname.split('.');
  if (parts.length < 2) return undefined; // localhost وحده
  return parts.slice(-2).join('.');
}

/** يحفظ اللغة في الكوكي + التخزين المحلي ويعيد التحميل لتطبيقها على كل الصفحة. */
export function persistLocale(next: Locale) {
  try {
    const domain = baseDomain();
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/${domainPart}; max-age=31536000; samesite=lax`;
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

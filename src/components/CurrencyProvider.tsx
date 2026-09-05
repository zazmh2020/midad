'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, type CurrencyCode } from '@/lib/currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (next: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** النطاق الأب لمشاركة الكوكي عبر النطاقات الفرعية (يُتجاهل للنطاقات العامة). */
function shareableDomain(): string | undefined {
  const host = window.location.hostname;
  if (/^\d+(\.\d+){3}$/.test(host)) return undefined;
  const parts = host.split('.');
  if (parts.length < 2) return undefined;
  const base = parts.slice(-2).join('.');
  const PUBLIC = ['vercel.app', 'netlify.app', 'github.io', 'pages.dev', 'onrender.com'];
  if (PUBLIC.includes(base)) return undefined;
  return base;
}

function persist(next: CurrencyCode) {
  try {
    const opts = 'path=/; max-age=31536000; samesite=lax';
    document.cookie = `${CURRENCY_COOKIE}=${next}; ${opts}`;
    const domain = shareableDomain();
    if (domain) document.cookie = `${CURRENCY_COOKIE}=${next}; ${opts}; domain=${domain}`;
    localStorage.setItem(CURRENCY_COOKIE, next);
  } catch {
    /* تجاهل */
  }
}

export function CurrencyProvider({
  initialCurrency = DEFAULT_CURRENCY,
  children,
}: { initialCurrency?: CurrencyCode; children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);

  // تبديل فوري بلا إعادة تحميل الصفحة
  const setCurrency = useCallback((next: CurrencyCode) => {
    if (!isCurrency(next)) return;
    persist(next);
    setCurrencyState(next);
  }, []);

  const value = useMemo<CurrencyContextValue>(() => ({ currency, setCurrency }), [currency, setCurrency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  return { currency: DEFAULT_CURRENCY, setCurrency: () => {} };
}

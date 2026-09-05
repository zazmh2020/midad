'use client';

import { useCurrency } from '@/components/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { CURRENCY_ORDER, currencyName, currencySymbol } from '@/lib/currency';

/** أيقونة تبديل العملة — تتنقّل بين ر.س / $ / ل.س عند الضغط. */
export default function CurrencyToggle({ className = '' }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const { locale } = useLocale();

  const idx = CURRENCY_ORDER.indexOf(currency);
  const next = CURRENCY_ORDER[(idx + 1) % CURRENCY_ORDER.length];

  return (
    <button
      type="button"
      className={`cur-toggle ${className}`}
      onClick={() => setCurrency(next)}
      aria-label={locale === 'en' ? `Currency: ${currencyName(currency, 'en')} — switch to ${currencyName(next, 'en')}` : `العملة: ${currencyName(currency, 'ar')} — بدّل إلى ${currencyName(next, 'ar')}`}
      title={`${currencyName(currency, locale)} → ${currencyName(next, locale)}`}
    >
      <span className="cur-toggle-sym" aria-hidden="true">{currencySymbol(currency, locale)}</span>
    </button>
  );
}

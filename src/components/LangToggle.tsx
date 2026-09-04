'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

/** زر تبديل اللغة عربي/إنجليزي. */
export default function LangToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      onClick={() => setLocale(next)}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={locale === 'ar' ? 'English' : 'العربية'}
    >
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
  );
}

'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

const GLOBE = 'url(/icons/administration/administration-language.svg)';

/** زر تبديل اللغة عربي/إنجليزي — أيقونة كرة أرضية. */
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
      <span className="lang-toggle-ic" aria-hidden="true" style={{ WebkitMaskImage: GLOBE, maskImage: GLOBE }} />
    </button>
  );
}

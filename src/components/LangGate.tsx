'use client';

import { useEffect, useState } from 'react';
import { persistLocale } from '@/lib/i18n/LocaleProvider';
import { translate } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

/** نافذة اختيار اللغة عند أول زيارة (يُمرَّر hasChosen من الخادم). */
export default function LangGate({ hasChosen }: { hasChosen: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasChosen) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [hasChosen]);

  if (!open) return null;

  function choose(locale: Locale) {
    persistLocale(locale);
    window.location.reload();
  }

  return (
    <div className="lang-gate-scrim" role="dialog" aria-modal="true" aria-label="Language / اللغة">
      <div className="lang-gate">
        <div className="lang-gate-logo">مِداد · Midad</div>
        <h2>{translate('ar', 'lang.title')}</h2>
        <p className="lang-gate-en">{translate('en', 'lang.title')}</p>
        <div className="lang-gate-opts">
          <button className="lang-gate-opt" onClick={() => choose('ar')}>
            <span className="lang-gate-flag">ع</span>
            <span>العربية</span>
          </button>
          <button className="lang-gate-opt" onClick={() => choose('en')}>
            <span className="lang-gate-flag">EN</span>
            <span>English</span>
          </button>
        </div>
      </div>
    </div>
  );
}

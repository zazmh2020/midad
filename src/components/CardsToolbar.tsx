'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

/** شريط أدوات البطاقات — طباعة/حفظ كملف PDF عبر متصفّح المستخدم. */
export default function CardsToolbar() {
  const { t } = useLocale();
  return (
    <div className="org-toolbar">
      <span className="org-toolbar-spacer" />
      <button className="org-btn org-btn-primary" onClick={() => window.print()}>
        {t('card.print')}
      </button>
    </div>
  );
}

'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

/** شريط أدوات التقرير — طباعة أو حفظ كملف PDF عبر متصفّح المستخدم (يدعم العربية بإتقان). */
export default function ReportToolbar() {
  const { t } = useLocale();
  return (
    <div className="rep-toolbar">
      <button className="org-btn org-btn-primary" onClick={() => window.print()}>
        {t('rep.export')}
      </button>
    </div>
  );
}

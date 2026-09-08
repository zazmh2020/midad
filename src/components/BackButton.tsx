'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';

/** زرّ العودة للصفحة السابقة — يختفي في الصفحة الجذر (base). */
export default function BackButton({ base, className = 'app-back' }: { base?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  if (base && pathname === base) return null;
  return (
    <button className={className} onClick={() => router.back()} aria-label={t('shell.back')} title={t('shell.back')}>
      <svg className="app-back-ic" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4l-6 6 6 6" />
      </svg>
      <span>{t('shell.back')}</span>
    </button>
  );
}

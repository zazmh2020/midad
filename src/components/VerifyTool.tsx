'use client';

import { useState, type FormEvent } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

// Web NFC (متوفّر على Android Chrome فقط) — نوع مبسّط
type NDEFReaderLike = { scan: () => Promise<void>; addEventListener: (t: string, cb: (e: unknown) => void) => void };

/** أداة تحقّق من البطاقات: إدخال الرمز يدويًا أو قراءة NFC، ثم فتح صفحة التحقّق. */
export default function VerifyTool() {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [nfcState, setNfcState] = useState<'idle' | 'scanning' | 'unsupported' | 'error'>('idle');

  const hasNfc = typeof window !== 'undefined' && 'NDEFReader' in window;

  function go(token: string) {
    const clean = token.trim().replace(/^.*\/verify\//, ''); // يقبل رابطًا كاملًا أو رمزًا فقط
    if (clean) window.open(`/verify/${encodeURIComponent(clean)}`, '_blank', 'noopener');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(code);
  }

  async function scanNfc() {
    if (!hasNfc) { setNfcState('unsupported'); return; }
    try {
      setNfcState('scanning');
      const reader = new (window as unknown as { NDEFReader: new () => NDEFReaderLike }).NDEFReader();
      await reader.scan();
      reader.addEventListener('reading', (evt: unknown) => {
        const message = (evt as { message?: { records?: { recordType: string; data: ArrayBuffer }[] } }).message;
        const rec = message?.records?.[0];
        if (rec) {
          try {
            const text = new TextDecoder().decode(rec.data);
            go(text);
            setNfcState('idle');
          } catch { setNfcState('error'); }
        }
      });
    } catch {
      setNfcState('error');
    }
  }

  return (
    <div className="vt-wrap">
      <form className="org-form vt-form" onSubmit={onSubmit}>
        <div className="org-field">
          <label htmlFor="vt-code">{t('verifyTool.codeLabel')}</label>
          <input id="vt-code" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" autoComplete="off" />
        </div>
        <div className="org-form-actions vt-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={!code.trim()}>{t('verifyTool.check')}</button>
          <button type="button" className="org-btn" onClick={scanNfc}>
            {nfcState === 'scanning' ? t('verifyTool.scanning') : t('verifyTool.nfc')}
          </button>
        </div>
      </form>

      {nfcState === 'unsupported' && <div className="org-alert vt-note">{t('verifyTool.nfcUnsupported')}</div>}
      {nfcState === 'error' && <div className="org-alert vt-note">{t('verifyTool.nfcError')}</div>}
      {nfcState === 'scanning' && <div className="vt-note vt-scanning">{t('verifyTool.scanHint')}</div>}

      <p className="vt-hint">{t('verifyTool.hint')}</p>
    </div>
  );
}

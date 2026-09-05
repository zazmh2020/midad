'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * تخصيص الهوية البصرية للجهة: لون أساسي + شعار.
 * apiBase: نقطة الحفظ (org أو admin).
 */
export default function BrandingForm({
  brandColor: initialColor = '',
  logoUrl: initialLogo = '',
  apiBase = '/api/org/branding',
}: {
  brandColor?: string | null;
  logoUrl?: string | null;
  apiBase?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [color, setColor] = useState((initialColor ?? '') || '#6B57A0');
  const [enabled, setEnabled] = useState(!!initialColor);
  const [logoUrl, setLogoUrl] = useState(initialLogo ?? '');
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandColor: enabled ? color : '', logoUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setStatus({ kind: 'error', msg: data.error ?? t('form.saveErr') });
      else { setStatus({ kind: 'ok', msg: t('brand.saved') }); router.refresh(); }
    } catch {
      setStatus({ kind: 'error', msg: t('form.netErr') });
    } finally { setBusy(false); }
  }

  const shown = enabled ? color : '#6B57A0';

  return (
    <form className="org-form brand-form" onSubmit={save}>
      {status && <div className={`org-alert ${status.kind === 'ok' ? 'is-ok' : ''}`}>{status.msg}</div>}

      {/* معاينة */}
      <div className="brand-preview" style={{ ['--bc' as string]: shown }}>
        <div className="brand-preview-bar">
          {logoUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="brand-preview-logo" />
          ) : (
            <span className="brand-preview-mark">م</span>
          )}
          <span className="brand-preview-name">{t('brand.previewName')}</span>
        </div>
        <div className="brand-preview-body">
          <span className="brand-preview-btn">{t('brand.previewBtn')}</span>
          <span className="brand-preview-chip">{t('brand.previewChip')}</span>
        </div>
      </div>

      <label className="brand-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t('brand.useCustom')}
      </label>

      {enabled && (
        <div className="org-field">
          <label htmlFor="bc">{t('brand.primaryColor')}</label>
          <div className="brand-color-row">
            <input id="bc" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <input type="text" dir="ltr" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6B57A0" />
          </div>
        </div>
      )}

      <div className="org-field">
        <label htmlFor="lg">{t('brand.logo')}</label>
        <input id="lg" dir="ltr" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
        <span className="org-hint">{t('brand.logoHint2')}</span>
      </div>

      <div className="org-form-actions">
        <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
          {busy ? t('form.saving') : t('brand.save')}
        </button>
      </div>
    </form>
  );
}

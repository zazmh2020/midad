'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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
      if (!res.ok) setStatus({ kind: 'error', msg: data.error ?? 'تعذّر الحفظ.' });
      else { setStatus({ kind: 'ok', msg: 'تم حفظ الهوية البصرية.' }); router.refresh(); }
    } catch {
      setStatus({ kind: 'error', msg: 'تعذّر الاتصال بالخادم.' });
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
          <span className="brand-preview-name">هيئة الجهة</span>
        </div>
        <div className="brand-preview-body">
          <span className="brand-preview-btn">زر أساسي</span>
          <span className="brand-preview-chip">وسم</span>
        </div>
      </div>

      <label className="brand-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        استخدام لون هوية مخصّص للجهة
      </label>

      {enabled && (
        <div className="org-field">
          <label htmlFor="bc">اللون الأساسي</label>
          <div className="brand-color-row">
            <input id="bc" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <input type="text" dir="ltr" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6B57A0" />
          </div>
        </div>
      )}

      <div className="org-field">
        <label htmlFor="lg">رابط الشعار</label>
        <input id="lg" dir="ltr" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
        <span className="org-hint">يظهر في شريط الجهة الجانبي. اتركه فارغًا لاستخدام شعار مِداد.</span>
      </div>

      <div className="org-form-actions">
        <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : 'حفظ الهوية البصرية'}
        </button>
      </div>
    </form>
  );
}

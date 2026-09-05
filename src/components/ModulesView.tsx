'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ORG_MODULES, MODULE_LABEL_KEY, MODULE_DESC_KEY, type OrgModule } from '@/lib/modules';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function ModulesView({
  disabled, canManage,
}: { disabled: string[]; canManage: boolean }) {
  const t = useT();
  const router = useRouter();
  const [off, setOff] = useState<Set<string>>(new Set(disabled));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle(m: OrgModule) {
    if (!canManage || busy) return;
    const next = new Set(off);
    if (next.has(m)) next.delete(m); else next.add(m);
    setOff(next);
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/org/modules', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabledModules: [...next] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? t('form.saveErr')); setOff(new Set(off)); }
      else router.refresh();
    } catch { setError(t('form.netErr')); setOff(new Set(off)); }
    finally { setBusy(false); }
  }

  return (
    <>
      {error && <div className="org-alert">{error}</div>}
      <div className="org-modules">
        {ORG_MODULES.map((m) => {
          const on = !off.has(m);
          return (
            <div key={m} className={`org-module-row ${on ? 'is-on' : ''}`}>
              <div className="org-module-tx">
                <span className="org-module-name">{t(MODULE_LABEL_KEY[m])}</span>
                <span className="org-module-desc">{t(MODULE_DESC_KEY[m])}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={t(MODULE_LABEL_KEY[m])}
                className={`org-switch ${on ? 'is-on' : ''}`}
                disabled={!canManage || busy}
                onClick={() => toggle(m)}
              >
                <span className="org-switch-knob" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

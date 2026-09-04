'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function OrgSettingsForm({ name: initial }: { name: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [status, setStatus] = useState<'' | 'saved' | 'error'>('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    setBusy(true);
    try {
      const res = await fetch('/api/org/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'تعذّر الحفظ.');
      } else {
        setStatus('saved');
        setMessage('تم الحفظ.');
        router.refresh();
      }
    } catch {
      setStatus('error');
      setMessage('تعذّر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="org-form" onSubmit={handleSubmit}>
      {status === 'error' && <div className="org-alert">{message}</div>}
      {status === 'saved' && <div className="org-alert is-ok">{message}</div>}

      <div className="org-field">
        <label htmlFor="orgName">اسم المؤسسة</label>
        <input id="orgName" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
      </div>

      <div className="org-form-actions">
        <button type="submit" className="org-btn org-btn-primary" disabled={busy || name.trim() === initial.trim()}>
          {busy ? 'جارٍ الحفظ…' : 'حفظ'}
        </button>
      </div>
    </form>
  );
}

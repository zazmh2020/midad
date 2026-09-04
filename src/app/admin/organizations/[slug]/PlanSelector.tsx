'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/plans';

export default function PlanSelector({ slug, current }: { slug: string; current: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState(current);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/organizations/${slug}/plan`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ kind: 'error', text: d.error ?? 'تعذّر الحفظ.' });
      else { setMsg({ kind: 'ok', text: 'تم تحديث الباقة.' }); router.refresh(); }
    } catch { setMsg({ kind: 'error', text: 'تعذّر الاتصال بالخادم.' }); }
    finally { setBusy(false); }
  }

  return (
    <div className="plan-assign">
      <select value={plan} onChange={(e) => setPlan(e.target.value)} disabled={busy}>
        {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button className="btn-admin-primary" onClick={save} disabled={busy || plan === current}>
        {busy ? 'جارٍ الحفظ…' : 'تحديث الباقة'}
      </button>
      {msg && <span className={msg.kind === 'ok' ? 'plan-msg-ok' : 'plan-msg-err'}>{msg.text}</span>}
    </div>
  );
}

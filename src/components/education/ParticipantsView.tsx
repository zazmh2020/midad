'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type P = { id: string; name: string; score: number | null };

export default function ParticipantsView({ competitionId, participants, canManage }: { competitionId: string; participants: P[]; canManage: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const ranked = useMemo(() =>
    [...participants].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)), [participants]);

  async function add(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy('__new');
    try {
      const res = await fetch(`/api/org/competitions/${competitionId}/participants`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setName(''); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusy(null); }
  }
  async function setScore(pid: string, score: string) {
    setBusy(pid);
    try { await fetch(`/api/org/competitions/participants/${pid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score }) }); router.refresh(); }
    finally { setBusy(null); }
  }
  async function remove(pid: string) {
    setBusy(pid);
    try { const res = await fetch(`/api/org/competitions/participants/${pid}`, { method: 'DELETE' }); if (res.ok) router.refresh(); }
    finally { setBusy(null); }
  }

  return (
    <div className="org-panel">
      <h2>{t('comp.participants')}</h2>
      {error && <div className="org-alert">{error}</div>}
      {canManage && (
        <form className="srch-bar" onSubmit={add} style={{ marginBottom: '1rem' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('comp.participantName')} required />
          <button type="submit" className="org-btn org-btn-primary" disabled={busy === '__new'}>{t('comp.addParticipant')}</button>
        </form>
      )}
      {ranked.length === 0 ? (
        <p className="org-panel-sub">{t('comp.noParticipants')}</p>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr><th>{t('comp.rank')}</th><th>{t('comp.participant')}</th><th>{t('comp.score')}</th><th></th></tr></thead>
            <tbody>
              {ranked.map((p, i) => (
                <tr key={p.id}>
                  <td><span className={`comp-rank ${i < 3 ? `comp-rank-${i + 1}` : ''}`}>{i + 1}</span></td>
                  <td><strong>{p.name}</strong></td>
                  <td>
                    {canManage
                      ? <input className="qm-in qm-num" type="number" defaultValue={p.score ?? ''} disabled={busy === p.id} onBlur={(e) => setScore(p.id, e.target.value)} />
                      : (p.score ?? '—')}
                  </td>
                  <td className="org-row-actions">{canManage && <button className="org-btn org-btn-danger" disabled={busy === p.id} onClick={() => remove(p.id)}>{t('view.delete')}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

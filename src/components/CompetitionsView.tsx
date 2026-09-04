'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';

interface Competition {
  id: string; name: string; level: string | null; status: string; startDate: string | null;
}

const STATUS: Record<string, { label: string; kind: 'ok' | 'warn' | 'muted' }> = {
  UPCOMING: { label: 'قادمة', kind: 'warn' },
  OPEN: { label: 'مفتوحة', kind: 'ok' },
  CLOSED: { label: 'منتهية', kind: 'muted' },
};
const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

export default function CompetitionsView({ competitions }: { competitions: Competition[] }) {
  const router = useRouter();
  const [active, setActive] = useState<string>(competitions[0]?.id ?? 'new');
  const [creating, setCreating] = useState(competitions.length === 0);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const cur = competitions.find((c) => c.id === active);

  async function create(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (name.trim().length < 2) { setErr('أدخل اسمًا صحيحًا للمسابقة.'); return; }
    setBusy(true);
    const res = await fetch('/api/org/competitions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, level, startDate: startDate || null, status }),
    });
    setBusy(false);
    if (res.ok) { setName(''); setLevel(''); setStartDate(''); setStatus('UPCOMING'); setCreating(false); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'تعذّر الإنشاء.'); }
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/org/competitions?id=${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="hub">
      <div className="hub-list">
        <button className={`hub-item ${creating ? 'is-active' : ''}`} onClick={() => setCreating(true)}>
          <span className="hub-item-ic"><Icon name="actions/actions-add" size={18} /></span>
          <span className="hub-item-tx"><span className="t">مسابقة جديدة</span><span className="s">أنشئ مسابقة حفظ أو تجويد</span></span>
        </button>
        {competitions.map((c) => (
          <button
            key={c.id}
            className={`hub-item ${!creating && active === c.id ? 'is-active' : ''}`}
            onClick={() => { setActive(c.id); setCreating(false); }}
          >
            <span className="hub-item-ic"><Icon name="operations/operations-events" size={18} /></span>
            <span className="hub-item-tx"><span className="t">{c.name}</span><span className="s">{c.level ?? 'عام'}</span></span>
            <span className={`hub-tag ${STATUS[c.status]?.kind ?? 'muted'}`}>{STATUS[c.status]?.label ?? c.status}</span>
          </button>
        ))}
      </div>

      <div className="hub-panel">
        <AnimatePresence mode="wait">
          {creating ? (
            <motion.div key="new" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <form className="mod-detail" onSubmit={create}>
                <div className="mod-detail-hd">
                  <span className="mod-detail-ic"><Icon name="operations/operations-events" size={22} /></span>
                  <div><h3>مسابقة جديدة</h3><p>عرّف بيانات المسابقة الأساسية.</p></div>
                </div>
                {err && <div className="org-alert" style={{ marginBottom: '0.8rem' }}>{err}</div>}
                <div className="org-field"><label>اسم المسابقة</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مسابقة الحفظ الرمضانية" /></div>
                <div className="org-field"><label>المستوى</label><input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="جزء عمّ / 5 أجزاء / القرآن كاملًا" /></div>
                <div className="org-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div className="org-field"><label>تاريخ البدء</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div className="org-field"><label>الحالة</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="UPCOMING">قادمة</option><option value="OPEN">مفتوحة</option><option value="CLOSED">منتهية</option>
                    </select>
                  </div>
                </div>
                <div className="org-form-actions"><button className="org-btn org-btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إنشاء المسابقة'}</button></div>
              </form>
            </motion.div>
          ) : cur ? (
            <motion.div key={cur.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="mod-detail">
                <div className="mod-detail-hd">
                  <span className="mod-detail-ic"><Icon name="operations/operations-events" size={22} /></span>
                  <div><h3>{cur.name}</h3><p>{cur.level ?? 'مسابقة عامة'}</p></div>
                </div>
                <div className="mod-kpis">
                  <div className="mod-kpi"><div className="k">الحالة</div><div className="v" style={{ fontSize: '1rem' }}>{STATUS[cur.status]?.label}</div></div>
                  <div className="mod-kpi"><div className="k">تاريخ البدء</div><div className="v" style={{ fontSize: '0.9rem' }}>{cur.startDate ? dateFmt.format(new Date(cur.startDate)) : '—'}</div></div>
                  <div className="mod-kpi"><div className="k">المستوى</div><div className="v" style={{ fontSize: '0.9rem' }}>{cur.level ?? 'عام'}</div></div>
                </div>
                <div className="org-form-actions">
                  <button className="org-btn org-btn-danger" onClick={() => remove(cur.id)} disabled={busy}>حذف المسابقة</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mod-detail"><p style={{ color: 'var(--gray-500)' }}>اختر مسابقة أو أنشئ واحدة جديدة.</p></div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

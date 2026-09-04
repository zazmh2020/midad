'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { HALAQA_TYPES, halaqaTypeLabel } from '@/lib/permissions';

type Halaqa = {
  id: string; name: string; type: string; schedule: string | null;
  teacherId: string | null; teacherName: string | null; studentCount: number;
};
type Ref = { id: string; name: string };

export default function HalaqatView({ halaqat, teachers }: { halaqat: Halaqa[]; teachers: Ref[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('MEMORIZATION');
  const [schedule, setSchedule] = useState('');
  const [teacherId, setTeacherId] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/halaqat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, schedule, teacherId: teacherId || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الإنشاء.');
      else { setName(''); setSchedule(''); setTeacherId(''); setType('MEMORIZATION'); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/halaqat/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحفظ.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه الحلقة؟ سيُفصل طلابها عنها.')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/halaqat/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحذف.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? 'إلغاء' : '+ حلقة جديدة'}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field">
            <label htmlFor="h-name">اسم الحلقة</label>
            <input id="h-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="h-type">النوع</label>
              <select id="h-type" value={type} onChange={(e) => setType(e.target.value)}>
                {HALAQA_TYPES.map((t) => <option key={t} value={t}>{halaqaTypeLabel(t)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="h-teacher">المعلّم</label>
              <select id="h-teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">— بلا معلّم</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="h-sched">المواعيد <span className="org-hint">اختياري</span></label>
              <input id="h-sched" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="السبت والثلاثاء 5م" />
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'إنشاء الحلقة'}
            </button>
          </div>
        </form>
      )}

      {halaqat.length === 0 ? (
        <div className="org-empty">لا توجد حلقات بعد.</div>
      ) : (
        <div className="org-cards">
          {halaqat.map((h) => (
            <article key={h.id} className="org-card">
              <div className="org-card-head">
                <h3>{h.name}</h3>
                <span className="org-chip">{halaqaTypeLabel(h.type)}</span>
              </div>
              <div className="org-card-meta">
                <span>المعلّم: {h.teacherName ?? '—'}</span>
                <span>الطلاب: {h.studentCount}</span>
              </div>
              {h.schedule && <p className="org-card-desc">{h.schedule}</p>}
              <div className="org-card-actions">
                <select className="org-inline-select" value={h.teacherId ?? ''} disabled={busyId === h.id}
                  onChange={(e) => patch(h.id, { teacherId: e.target.value || null })} aria-label="المعلّم">
                  <option value="">— بلا معلّم</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button className="org-btn org-btn-danger" disabled={busyId === h.id} onClick={() => remove(h.id)}>حذف</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

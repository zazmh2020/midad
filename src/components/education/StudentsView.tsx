'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUSES, studentStatusLabel } from '@/lib/permissions';

type Student = {
  id: string; name: string; phone: string | null;
  guardianName: string | null; guardianPhone: string | null;
  status: string; halaqaId: string | null;
};
type Ref = { id: string; name: string };

export default function StudentsView({ students, halaqat }: { students: Student[]; halaqat: Ref[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | NONE | <halaqaId>

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [halaqaId, setHalaqaId] = useState('');

  const halaqaName = (id: string | null) => (id ? halaqat.find((h) => h.id === id)?.name ?? '—' : '—');
  const shown = useMemo(() => {
    if (filter === 'ALL') return students;
    if (filter === 'NONE') return students.filter((s) => !s.halaqaId);
    return students.filter((s) => s.halaqaId === filter);
  }, [students, filter]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, guardianName, guardianPhone, status, halaqaId: halaqaId || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الإنشاء.');
      else {
        setName(''); setPhone(''); setGuardianName(''); setGuardianPhone(''); setStatus('ACTIVE'); setHalaqaId('');
        setCreating(false); router.refresh();
      }
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/students/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحفظ.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف ملف هذا الطالب؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/students/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحذف.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        {halaqat.length > 0 && (
          <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="تصفية بالحلقة">
            <option value="ALL">كل الحلقات</option>
            <option value="NONE">بلا حلقة</option>
            {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? 'إلغاء' : '+ طالب جديد'}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="s-name">اسم الطالب</label>
              <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="s-phone">هاتف الطالب <span className="org-hint">اختياري</span></label>
              <input id="s-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="s-gname">اسم ولي الأمر</label>
              <input id="s-gname" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="s-gphone">هاتف ولي الأمر</label>
              <input id="s-gphone" dir="ltr" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="s-status">الحالة</label>
              <select id="s-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{studentStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="s-halaqa">الحلقة</label>
              <select id="s-halaqa" value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)}>
                <option value="">— بلا حلقة</option>
                {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'إضافة الطالب'}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty">{students.length === 0 ? 'لا يوجد طلاب بعد.' : 'لا طلاب في هذه الحلقة.'}</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr><th>الطالب</th><th>ولي الأمر</th><th>الحالة</th><th>الحلقة</th><th></th></tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong>{s.phone && <small dir="ltr">{s.phone}</small>}</td>
                  <td>{s.guardianName ?? '—'}{s.guardianPhone && <small dir="ltr">{s.guardianPhone}</small>}</td>
                  <td>
                    <select className="org-inline-select" value={s.status} disabled={busyId === s.id}
                      onChange={(e) => patch(s.id, { status: e.target.value })}>
                      {STUDENT_STATUSES.map((v) => <option key={v} value={v}>{studentStatusLabel(v)}</option>)}
                    </select>
                  </td>
                  <td>
                    {halaqat.length > 0 ? (
                      <select className="org-inline-select" value={s.halaqaId ?? ''} disabled={busyId === s.id}
                        onChange={(e) => patch(s.id, { halaqaId: e.target.value || null })} aria-label="الحلقة">
                        <option value="">— بلا حلقة</option>
                        {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    ) : halaqaName(s.halaqaId)}
                  </td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-danger" disabled={busyId === s.id} onClick={() => remove(s.id)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

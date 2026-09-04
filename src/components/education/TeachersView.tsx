'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Teacher = {
  id: string; name: string; phone: string | null; specialization: string | null;
  isActive: boolean; halaqatCount: number;
};

export default function TeachersView({ teachers }: { teachers: Teacher[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/teachers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, specialization }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الإنشاء.');
      else { setName(''); setPhone(''); setSpecialization(''); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/teachers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحفظ.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا المعلّم؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/teachers/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحذف.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? 'إلغاء' : '+ معلّم جديد'}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="t-name">الاسم</label>
              <input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="t-phone">الهاتف <span className="org-hint">اختياري</span></label>
              <input id="t-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="t-spec">التخصص <span className="org-hint">تحفيظ، تجويد…</span></label>
              <input id="t-spec" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'إضافة المعلّم'}
            </button>
          </div>
        </form>
      )}

      {teachers.length === 0 ? (
        <div className="org-empty">لا يوجد معلمون بعد.</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr><th>المعلّم</th><th>التخصص</th><th>الحلقات</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className={t.isActive ? '' : 'is-inactive'}>
                  <td><strong>{t.name}</strong>{t.phone && <small dir="ltr">{t.phone}</small>}</td>
                  <td>{t.specialization ?? '—'}</td>
                  <td>{t.halaqatCount}</td>
                  <td><span className={`org-badge ${t.isActive ? 'is-on' : ''}`}>{t.isActive ? 'نشط' : 'موقوف'}</span></td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-quiet" disabled={busyId === t.id} onClick={() => patch(t.id, { isActive: !t.isActive })}>
                      {t.isActive ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button className="org-btn org-btn-danger" disabled={busyId === t.id} onClick={() => remove(t.id)}>حذف</button>
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

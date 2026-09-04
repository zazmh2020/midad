'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { VOLUNTEER_STATUSES, volunteerStatusLabel } from '@/lib/permissions';

type Volunteer = { id: string; name: string; phone: string | null; skills: string | null; status: string };

export default function VolunteersView({ volunteers }: { volunteers: Volunteer[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/resources/volunteers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, skills, status }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الإنشاء.');
      else { setName(''); setPhone(''); setSkills(''); setStatus('ACTIVE'); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/volunteers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحفظ.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا المتطوّع؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/volunteers/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحذف.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? 'إلغاء' : '+ متطوّع جديد'}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="v-name">الاسم</label>
              <input id="v-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="v-phone">الهاتف <span className="org-hint">اختياري</span></label>
              <input id="v-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="v-status">الحالة</label>
              <select id="v-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {VOLUNTEER_STATUSES.map((s) => <option key={s} value={s}>{volunteerStatusLabel(s)}</option>)}
              </select></div>
          </div>
          <div className="org-field"><label htmlFor="v-skills">المهارات / الاهتمامات <span className="org-hint">اختياري</span></label>
            <input id="v-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="تنظيم، إعلام، ميداني…" /></div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'إضافة المتطوّع'}
            </button>
          </div>
        </form>
      )}

      {volunteers.length === 0 ? (
        <div className="org-empty">لا يوجد متطوعون بعد.</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr><th>المتطوّع</th><th>المهارات</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.name}</strong>{v.phone && <small dir="ltr">{v.phone}</small>}</td>
                  <td>{v.skills ?? '—'}</td>
                  <td>
                    <select className="org-inline-select" value={v.status} disabled={busyId === v.id}
                      onChange={(e) => patch(v.id, { status: e.target.value })}>
                      {VOLUNTEER_STATUSES.map((s) => <option key={s} value={s}>{volunteerStatusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-danger" disabled={busyId === v.id} onClick={() => remove(v.id)}>حذف</button>
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

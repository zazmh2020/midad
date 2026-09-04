'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Team = {
  id: string; name: string; description: string | null; lead: string | null;
  departmentId: string | null; departmentName: string | null;
};
type Ref = { id: string; name: string };

export default function TeamsView({ teams, departments }: { teams: Team[]; departments: Ref[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [lead, setLead] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/resources/teams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lead, description, departmentId: departmentId || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الإنشاء.');
      else { setName(''); setLead(''); setDescription(''); setDepartmentId(''); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا الفريق؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/teams/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحذف.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? 'إلغاء' : '+ فريق جديد'}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="tm-name">اسم الفريق</label>
              <input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="tm-lead">قائد الفريق <span className="org-hint">اختياري</span></label>
              <input id="tm-lead" value={lead} onChange={(e) => setLead(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="tm-dept">الوحدة</label>
              <select id="tm-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— بلا وحدة</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select></div>
          </div>
          <div className="org-field"><label htmlFor="tm-desc">الوصف <span className="org-hint">اختياري</span></label>
            <textarea id="tm-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'إنشاء الفريق'}
            </button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="org-empty">لا توجد فرق بعد.</div>
      ) : (
        <div className="org-cards">
          {teams.map((t) => (
            <article key={t.id} className="org-card">
              <div className="org-card-head">
                <h3>{t.name}</h3>
                {t.departmentName && <span className="org-chip">{t.departmentName}</span>}
              </div>
              {t.lead && <span className="org-card-tag">القائد: {t.lead}</span>}
              {t.description && <p className="org-card-desc">{t.description}</p>}
              <div className="org-card-actions">
                <span className="org-toolbar-spacer" />
                <button className="org-btn org-btn-danger" disabled={busyId === t.id} onClick={() => remove(t.id)}>حذف</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

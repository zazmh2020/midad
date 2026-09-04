'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  CAMPAIGN_TYPES, CAMPAIGN_STATUSES, campaignTypeLabel, campaignStatusLabel,
} from '@/lib/permissions';

type Campaign = {
  id: string; name: string; description: string | null; type: string; status: string;
  goalAmount: number | null; startDate: string | null; endDate: string | null;
  departmentId: string | null; donationCount: number;
};
type Department = { id: string; name: string };

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
const numFmt = new Intl.NumberFormat('en-US');
const fmtDate = (d: string | null) => (d ? dateFmt.format(new Date(d)) : '—');

export default function CampaignsView({
  campaigns, departments, canManage,
}: { campaigns: Campaign[]; departments: Department[]; canManage: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CHARITY');
  const [status, setStatus] = useState('ACTIVE');
  const [goalAmount, setGoalAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name ?? null : null);
  const shown = useMemo(
    () => (filter === 'ALL' ? campaigns : campaigns.filter((c) => c.status === filter)),
    [campaigns, filter],
  );

  function resetForm() {
    setName(''); setDescription(''); setType('CHARITY'); setStatus('ACTIVE');
    setGoalAmount(''); setStartDate(''); setEndDate(''); setDepartmentId('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, type, status, goalAmount: goalAmount || null, startDate, endDate, departmentId: departmentId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الإنشاء.');
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/campaigns/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحفظ.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه الحملة نهائياً؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحذف.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="تصفية حسب الحالة">
          <option value="ALL">كل الحالات</option>
          {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{campaignStatusLabel(s)}</option>)}
        </select>
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? 'إلغاء' : '+ حملة جديدة'}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field">
            <label htmlFor="c-name">اسم الحملة</label>
            <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="org-field">
            <label htmlFor="c-desc">الوصف <span className="org-hint">اختياري</span></label>
            <textarea id="c-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="c-type">النوع</label>
              <select id="c-type" value={type} onChange={(e) => setType(e.target.value)}>
                {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{campaignTypeLabel(t)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="c-status">الحالة</label>
              <select id="c-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{campaignStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="c-goal">الهدف المالي <span className="org-hint">اختياري</span></label>
              <input id="c-goal" type="number" min={0} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="c-start">تاريخ البداية</label>
              <input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="c-end">تاريخ النهاية</label>
              <input id="c-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="c-dept">الوحدة</label>
              <select id="c-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— بلا وحدة</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الإنشاء…' : 'إنشاء الحملة'}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty">{campaigns.length === 0 ? 'لا توجد حملات بعد.' : 'لا حملات بهذه الحالة.'}</div>
      ) : (
        <div className="org-cards">
          {shown.map((c) => (
            <article key={c.id} className="org-card">
              <div className="org-card-head">
                <h3>{c.name}</h3>
                <span className={`org-status org-cstatus-${c.status.toLowerCase()}`}>{campaignStatusLabel(c.status)}</span>
              </div>
              <div className="org-card-tags">
                <span className="org-chip">{campaignTypeLabel(c.type)}</span>
                {deptName(c.departmentId) && <span className="org-card-tag">{deptName(c.departmentId)}</span>}
              </div>
              {c.description && <p className="org-card-desc">{c.description}</p>}
              <div className="org-card-meta">
                <span>الهدف: {c.goalAmount != null ? numFmt.format(c.goalAmount) : '—'}</span>
                <span>التبرعات: {c.donationCount}</span>
              </div>
              <div className="org-card-meta">
                <span>من {fmtDate(c.startDate)}</span>
                <span>إلى {fmtDate(c.endDate)}</span>
              </div>
              {canManage && (
                <div className="org-card-actions">
                  <select className="org-inline-select" value={c.status} disabled={busyId === c.id}
                    onChange={(e) => patch(c.id, { status: e.target.value })}>
                    {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{campaignStatusLabel(s)}</option>)}
                  </select>
                  <button className="org-btn org-btn-danger" disabled={busyId === c.id} onClick={() => remove(c.id)}>حذف</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

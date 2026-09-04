'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  DONATION_METHODS, DONATION_STATUSES, donationMethodLabel, donationStatusLabel,
} from '@/lib/permissions';

type Donation = {
  id: string; donorName: string; amount: number; method: string; status: string;
  note: string | null; campaignId: string | null; donatedAt: string;
};
type Ref = { id: string; name: string };

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
const numFmt = new Intl.NumberFormat('en-US');

export default function DonationsView({
  donations, campaigns, totalReceived, canManage,
}: { donations: Donation[]; campaigns: Ref[]; totalReceived: number; canManage: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [status, setStatus] = useState('RECEIVED');
  const [campaignId, setCampaignId] = useState('');
  const [donatedAt, setDonatedAt] = useState('');
  const [note, setNote] = useState('');

  const campName = (id: string | null) => (id ? campaigns.find((c) => c.id === id)?.name ?? '—' : '—');
  const shown = useMemo(
    () => (filter === 'ALL' ? donations : donations.filter((d) => d.status === filter)),
    [donations, filter],
  );

  function resetForm() {
    setDonorName(''); setAmount(''); setMethod('CASH'); setStatus('RECEIVED');
    setCampaignId(''); setDonatedAt(''); setNote('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/donations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorName, amount, method, status, note, donatedAt, campaignId: campaignId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر التسجيل.');
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/donations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحفظ.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا التبرع نهائياً؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/donations/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحذف.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-stats">
        <div className="org-stat">
          <div className="org-stat-label">إجمالي المستلَم</div>
          <div className="org-stat-value">{numFmt.format(totalReceived)}</div>
        </div>
        <div className="org-stat">
          <div className="org-stat-label">عدد العمليات</div>
          <div className="org-stat-value">{donations.length}</div>
        </div>
      </div>

      <div className="org-toolbar">
        <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="تصفية حسب الحالة">
          <option value="ALL">كل الحالات</option>
          {DONATION_STATUSES.map((s) => <option key={s} value={s}>{donationStatusLabel(s)}</option>)}
        </select>
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? 'إلغاء' : '+ تسجيل تبرع'}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="d-donor">اسم المتبرع</label>
              <input id="d-donor" value={donorName} onChange={(e) => setDonorName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="d-amount">المبلغ</label>
              <input id="d-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="d-date">التاريخ <span className="org-hint">افتراضيًا اليوم</span></label>
              <input id="d-date" type="date" value={donatedAt} onChange={(e) => setDonatedAt(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="d-method">طريقة الدفع</label>
              <select id="d-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {DONATION_METHODS.map((m) => <option key={m} value={m}>{donationMethodLabel(m)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="d-status">الحالة</label>
              <select id="d-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {DONATION_STATUSES.map((s) => <option key={s} value={s}>{donationStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="d-camp">الحملة</label>
              <select id="d-camp" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                <option value="">— بلا حملة</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="d-note">ملاحظة <span className="org-hint">اختياري</span></label>
            <input id="d-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ التسجيل…' : 'تسجيل التبرع'}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty">{donations.length === 0 ? 'لا توجد تبرعات بعد.' : 'لا تبرعات بهذه الحالة.'}</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>المتبرع</th>
                <th>المبلغ</th>
                <th>الطريقة</th>
                <th>الحالة</th>
                <th>الحملة</th>
                <th>التاريخ</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.donorName}</strong>
                    {d.note && <small>{d.note}</small>}
                  </td>
                  <td>{numFmt.format(d.amount)}</td>
                  <td>{donationMethodLabel(d.method)}</td>
                  <td>
                    {canManage ? (
                      <select className="org-inline-select" value={d.status} disabled={busyId === d.id}
                        onChange={(e) => patch(d.id, { status: e.target.value })}>
                        {DONATION_STATUSES.map((s) => <option key={s} value={s}>{donationStatusLabel(s)}</option>)}
                      </select>
                    ) : (
                      <span className={`org-badge ${d.status === 'RECEIVED' ? 'is-on' : ''}`}>{donationStatusLabel(d.status)}</span>
                    )}
                  </td>
                  <td>{campName(d.campaignId)}</td>
                  <td>{dateFmt.format(new Date(d.donatedAt))}</td>
                  {canManage && (
                    <td className="org-row-actions">
                      <button className="org-btn org-btn-danger" disabled={busyId === d.id} onClick={() => remove(d.id)}>حذف</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

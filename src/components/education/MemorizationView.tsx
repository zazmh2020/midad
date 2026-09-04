'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MEMO_KINDS, MEMO_RATINGS, memoKindLabel, memoRatingLabel } from '@/lib/permissions';

type Entry = {
  id: string; kind: string; content: string; rating: string;
  notes: string | null; studentName: string; date: string;
};
type Ref = { id: string; name: string };

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

export default function MemorizationView({ entries, students }: { entries: Entry[]; students: Ref[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [studentId, setStudentId] = useState('');
  const [kind, setKind] = useState('NEW');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('GOOD');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/memorization', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, kind, content, rating, date, notes }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحفظ.');
      else { setContent(''); setNotes(''); setDate(''); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا السجل؟')) return;
    setBusyId(id); setError('');
    try {
      const res = await fetch(`/api/org/education/memorization/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? 'تعذّر الحذف.'); else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" disabled={students.length === 0}
          onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? 'إلغاء' : '+ تسجيل تسميع'}
        </button>
      </div>

      {students.length === 0 && <div className="org-alert">أضِف طلابًا أولًا لتسجيل التسميع.</div>}
      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="m-student">الطالب</label>
              <select id="m-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">— اختر طالبًا</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="m-kind">النوع</label>
              <select id="m-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                {MEMO_KINDS.map((k) => <option key={k} value={k}>{memoKindLabel(k)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="m-date">التاريخ <span className="org-hint">افتراضيًا اليوم</span></label>
              <input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="m-content">المقطع</label>
              <input id="m-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="سورة البقرة 1-20" required />
            </div>
            <div className="org-field">
              <label htmlFor="m-rating">التقدير</label>
              <select id="m-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
                {MEMO_RATINGS.map((r) => <option key={r} value={r}>{memoRatingLabel(r)}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="m-notes">ملاحظات <span className="org-hint">اختياري</span></label>
            <input id="m-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'حفظ السجل'}
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="org-empty">لا سجلات تسميع بعد.</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr><th>الطالب</th><th>النوع</th><th>المقطع</th><th>التقدير</th><th>التاريخ</th><th></th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.studentName}</strong>{e.notes && <small>{e.notes}</small>}</td>
                  <td>{memoKindLabel(e.kind)}</td>
                  <td>{e.content}</td>
                  <td><span className={`org-status org-rating-${e.rating.toLowerCase()}`}>{memoRatingLabel(e.rating)}</span></td>
                  <td>{dateFmt.format(new Date(e.date))}</td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-danger" disabled={busyId === e.id} onClick={() => remove(e.id)}>حذف</button>
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

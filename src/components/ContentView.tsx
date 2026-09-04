'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

interface Announcement { id: string; title: string; body: string; createdAt: string; }

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

export default function ContentView({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (title.trim().length < 2 || body.trim().length < 2) { setErr('أكمل العنوان والمحتوى.'); return; }
    setBusy(true);
    const res = await fetch('/api/org/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    setBusy(false);
    if (res.ok) { setTitle(''); setBody(''); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'تعذّر النشر.'); }
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/org/announcements?id=${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="content-grid">
      <div>
        <form className="org-form" onSubmit={create} style={{ marginBottom: '1.25rem' }}>
          {err && <div className="org-alert" style={{ marginBottom: '0.7rem' }}>{err}</div>}
          <div className="org-field"><label>عنوان الخبر</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="افتتاح التسجيل للفصل الجديد" /></div>
          <div className="org-field"><label>المحتوى</label><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="نص الخبر أو الإعلان…" /></div>
          <div className="org-form-actions"><button className="org-btn org-btn-primary" disabled={busy}>{busy ? 'جارٍ النشر…' : 'نشر الخبر'}</button></div>
        </form>

        <div className="content-list">
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>لا توجد أخبار منشورة بعد.</p>
          ) : announcements.map((a) => (
            <div key={a.id} className="ann-card">
              <div className="ann-card-hd"><strong>{a.title}</strong></div>
              <p>{a.body}</p>
              <div className="ann-card-foot">
                <span>{dateFmt.format(new Date(a.createdAt))}</span>
                <button className="ann-del" onClick={() => remove(a.id)} disabled={busy}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-side">
        <div className="site-card">
          <h3>الموقع العام لمؤسستك</h3>
          <p>تُعرض أخبارك وهويتك البصرية (الشعار واللون) في صفحة عامة لمؤسستك — قريبًا.</p>
          <label className="site-toggle">
            <input type="checkbox" disabled /> نشر الموقع العام <span style={{ opacity: 0.7 }}>(قريبًا)</span>
          </label>
        </div>
        <div className="ann-card">
          <div className="ann-card-hd"><strong>نصيحة</strong></div>
          <p>الأخبار المنشورة هنا ستظهر لاحقًا في موقع مؤسستك العام وفي لوحة أعضائها.</p>
          <div className="ann-card-foot"><span><Icon name="documents/documents-documents" size={14} /> إدارة المحتوى</span></div>
        </div>
      </div>
    </div>
  );
}

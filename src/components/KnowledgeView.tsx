'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Article = {
  id: string; title: string; body: string; category: string | null;
  isPublished: boolean; author: string | null; updatedAt: string;
};

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

export default function KnowledgeView({
  articles, canManage,
}: { articles: Article[]; canManage: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [publish, setPublish] = useState(false);

  function resetForm() { setTitle(''); setCategory(''); setContent(''); setPublish(false); }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/knowledge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: content, category, isPublished: publish }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر النشر.');
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/knowledge/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحفظ.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه المقالة نهائياً؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/knowledge/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحذف.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  return (
    <>
      {canManage && (
        <div className="org-toolbar">
          <span className="org-toolbar-spacer" />
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? 'إلغاء' : '+ مقالة جديدة'}
          </button>
        </div>
      )}

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field">
            <label htmlFor="k-title">العنوان</label>
            <input id="k-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="org-field">
            <label htmlFor="k-cat">التصنيف <span className="org-hint">اختياري (سياسات، إجراءات…)</span></label>
            <input id="k-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="org-field">
            <label htmlFor="k-body">المحتوى</label>
            <textarea id="k-body" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <label className="org-check">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            نشرها للأعضاء الآن
          </label>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? 'جارٍ الحفظ…' : 'حفظ المقالة'}
            </button>
          </div>
        </form>
      )}

      {articles.length === 0 ? (
        <div className="org-empty">لا توجد مقالات بعد.</div>
      ) : (
        <div className="org-articles">
          {articles.map((a) => {
            const open = openId === a.id;
            return (
              <article key={a.id} className="org-article">
                <button className="org-article-head" onClick={() => setOpenId(open ? null : a.id)}>
                  <div>
                    <h3>{a.title}</h3>
                    <div className="org-article-meta">
                      {a.category && <span className="org-chip">{a.category}</span>}
                      {canManage && (
                        <span className={`org-badge ${a.isPublished ? 'is-on' : ''}`}>
                          {a.isPublished ? 'منشورة' : 'مسودّة'}
                        </span>
                      )}
                      <span>{a.author ?? 'غير معروف'} · {dateFmt.format(new Date(a.updatedAt))}</span>
                    </div>
                  </div>
                  <span className="org-article-caret">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="org-article-body">{a.body}</p>}
                {canManage && (
                  <div className="org-article-actions">
                    <button className="org-btn org-btn-quiet" disabled={busyId === a.id}
                      onClick={() => patch(a.id, { isPublished: !a.isPublished })}>
                      {a.isPublished ? 'إلغاء النشر' : 'نشر'}
                    </button>
                    <button className="org-btn org-btn-danger" disabled={busyId === a.id} onClick={() => remove(a.id)}>حذف</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

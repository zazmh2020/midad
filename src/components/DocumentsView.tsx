'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Doc = {
  id: string; name: string; description: string | null; category: string | null;
  fileName: string; contentType: string; size: number;
  departmentId: string | null; uploadedBy: string | null; createdAt: string;
};
type Ref = { id: string; name: string };

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} ب`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

export default function DocumentsView({
  documents, departments, storageReady, canManage,
}: { documents: Doc[]; departments: Ref[]; storageReady: boolean; canManage: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name ?? null : null);
  const categories = useMemo(
    () => Array.from(new Set(documents.map((d) => d.category).filter(Boolean))) as string[],
    [documents],
  );
  const shown = useMemo(
    () => (filter === 'ALL' ? documents : documents.filter((d) => d.category === filter)),
    [documents, filter],
  );

  function pickFile(f: File | null) {
    setFile(f);
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''));
  }

  function reset() {
    setFile(null); setName(''); setDescription(''); setCategory(''); setDepartmentId('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!file) { setError('اختر ملفًا.'); return; }
    setUploading(true);
    try {
      // 1) رابط رفع موقّع
      setProgress('جارٍ التجهيز…');
      const pres = await fetch('/api/org/documents/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
      });
      const pdata = await pres.json().catch(() => ({}));
      if (!pres.ok) { setError(pdata.error ?? 'تعذّر التجهيز.'); return; }

      // 2) رفع الملف مباشرةً إلى المخزن
      setProgress('جارٍ الرفع…');
      const put = await fetch(pdata.uploadUrl, {
        method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file,
      });
      if (!put.ok) { setError('فشل رفع الملف إلى المخزن.'); return; }

      // 3) تسجيل البيانات الوصفية
      setProgress('جارٍ الحفظ…');
      const save = await fetch('/api/org/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, category, key: pdata.key,
          fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size,
          departmentId: departmentId || null,
        }),
      });
      const sdata = await save.json().catch(() => ({}));
      if (!save.ok) { setError(sdata.error ?? 'تعذّر الحفظ.'); return; }

      reset();
      router.refresh();
    } catch {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setUploading(false);
      setProgress('');
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه الوثيقة نهائياً؟')) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/documents/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحذف.');
      else router.refresh();
    } catch { setError('تعذّر الاتصال بالخادم.'); }
    finally { setBusyId(null); }
  }

  return (
    <>
      {!storageReady && (
        <div className="org-alert">
          التخزين غير مُعدّ بعد. أضِف متغيّرات <code dir="ltr">S3_*</code> في ملف <code dir="ltr">.env</code> لتفعيل رفع الوثائق.
        </div>
      )}

      <div className="org-toolbar">
        {categories.length > 0 && (
          <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="تصفية حسب التصنيف">
            <option value="ALL">كل التصنيفات</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <span className="org-toolbar-spacer" />
      </div>

      {canManage && storageReady && (
        <form className="org-form" onSubmit={handleUpload}>
          <div className="org-field">
            <label htmlFor="doc-file">الملف <span className="org-hint">حتى 25 م.ب</span></label>
            <input id="doc-file" ref={fileRef} type="file" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="doc-name">اسم الوثيقة</label>
              <input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="doc-cat">التصنيف <span className="org-hint">اختياري</span></label>
              <input id="doc-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="سياسات، نماذج…" />
            </div>
            <div className="org-field">
              <label htmlFor="doc-dept">الوحدة</label>
              <select id="doc-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— بلا وحدة</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="doc-desc">الوصف <span className="org-hint">اختياري</span></label>
            <input id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-form-actions">
            {progress && <span className="org-hint">{progress}</span>}
            <button type="submit" className="org-btn org-btn-primary" disabled={uploading}>
              {uploading ? 'جارٍ…' : 'رفع الوثيقة'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="org-alert">{error}</div>}

      {shown.length === 0 ? (
        <div className="org-empty">{documents.length === 0 ? 'لا توجد وثائق بعد.' : 'لا وثائق بهذا التصنيف.'}</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>الوثيقة</th>
                <th>التصنيف</th>
                <th>الوحدة</th>
                <th>الحجم</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    <small dir="ltr">{d.fileName}</small>
                    {d.description && <small>{d.description}</small>}
                  </td>
                  <td>{d.category ?? '—'}</td>
                  <td>{deptName(d.departmentId) ?? '—'}</td>
                  <td dir="ltr">{humanSize(d.size)}</td>
                  <td>{dateFmt.format(new Date(d.createdAt))}</td>
                  <td className="org-row-actions">
                    <a className="org-btn org-btn-quiet" href={`/api/org/documents/${d.id}/download`}>تنزيل</a>
                    {canManage && (
                      <button className="org-btn org-btn-danger" disabled={busyId === d.id} onClick={() => remove(d.id)}>حذف</button>
                    )}
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

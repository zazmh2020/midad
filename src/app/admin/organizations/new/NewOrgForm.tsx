'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const orgTypes = [
  { value: 'ASSOCIATION', label: 'جمعية / مؤسسة' },
  { value: 'MOSQUE', label: 'مسجد / مركز قرآني' },
  { value: 'SCHOOL', label: 'مركز تعليمي' },
  { value: 'PROJECT', label: 'مشروع خاص' },
];

export default function NewOrgForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ slug: string; adminEmail: string } | null>(null);

  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('ASSOCIATION');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // اقتراح slug تلقائي من اسم المؤسسة
  function handleOrgNameChange(value: string) {
    setOrgName(value);
    if (!slug || slug === autoSlug(orgName)) {
      setSlug(autoSlug(value));
    }
  }

  function autoSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug,
          type,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'فشل الإنشاء.');
        setBusy(false);
        return;
      }

      setResult({ slug: data.slug, adminEmail });
      setBusy(false);
    } catch {
      setError('تعذّر الاتصال بالخادم.');
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="success-panel">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2>تم إنشاء المؤسسة بنجاح</h2>
        <p>يمكن الآن لمديرها الدخول عبر الرابط التالي:</p>

        <div className="success-details">
          <div className="detail-row">
            <span className="detail-label">رابط المؤسسة:</span>
            <code dir="ltr">http://{result.slug}.midad.localhost:3000</code>
          </div>
          <div className="detail-row">
            <span className="detail-label">صفحة الدخول:</span>
            <code dir="ltr">http://{result.slug}.midad.localhost:3000/login</code>
          </div>
          <div className="detail-row">
            <span className="detail-label">بريد المدير:</span>
            <code dir="ltr">{result.adminEmail}</code>
          </div>
        </div>

        <div className="success-actions">
          <Link href="/admin/organizations" className="btn-admin-primary">
            العودة للقائمة
          </Link>
          <button
            className="btn-admin-outline"
            onClick={() => {
              setResult(null);
              setOrgName(''); setSlug(''); setAdminName(''); setAdminEmail(''); setAdminPassword('');
            }}
          >
            إنشاء أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {error && <div className="form-error"><span>⚠</span><span>{error}</span></div>}

      <fieldset>
        <legend>معلومات المؤسسة</legend>

        <div className="admin-field">
          <label htmlFor="orgName">اسم المؤسسة</label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => handleOrgNameChange(e.target.value)}
            placeholder="جمعية القرآن الكريم"
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="slug">
            الرابط الفرعي (slug)
            <span className="field-hint">حروف إنجليزية صغيرة وأرقام وشرطات فقط</span>
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            dir="ltr"
            placeholder="alqoran"
            pattern="[a-z0-9-]+"
            required
          />
          {slug && (
            <div className="field-preview">
              الرابط: <code dir="ltr">{slug}.midad.localhost:3000</code>
            </div>
          )}
        </div>

        <div className="admin-field">
          <label htmlFor="type">نوع المؤسسة</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {orgTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>حساب مدير المؤسسة</legend>

        <div className="admin-field">
          <label htmlFor="adminName">الاسم الكامل</label>
          <input
            id="adminName"
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="adminEmail">البريد الإلكتروني</label>
          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            dir="ltr"
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="adminPassword">
            كلمة المرور المؤقتة
            <span className="field-hint">8 محارف على الأقل — سيغيّرها المدير عند أول دخول</span>
          </label>
          <input
            id="adminPassword"
            type="text"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            dir="ltr"
            minLength={8}
            required
          />
        </div>
      </fieldset>

      <div className="admin-form-actions">
        <Link href="/admin/organizations" className="btn-admin-outline">إلغاء</Link>
        <button type="submit" className="btn-admin-primary" disabled={busy}>
          {busy ? 'جارٍ الإنشاء...' : 'إنشاء المؤسسة'}
        </button>
      </div>
    </form>
  );
}

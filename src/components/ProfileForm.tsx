'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { roleLabel } from '@/lib/permissions';

export default function ProfileForm({
  name: initialName, email, role, avatarUrl: initialAvatar = '',
}: { name: string; email: string; role: string; avatarUrl?: string | null }) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? '');
  const [nameStatus, setNameStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwStatus, setPwStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setNameStatus(null);
    setNameBusy(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setNameStatus({ kind: 'error', msg: data.error ?? 'تعذّر الحفظ.' });
      else { setNameStatus({ kind: 'ok', msg: 'تم حفظ الملف الشخصي.' }); router.refresh(); }
    } catch {
      setNameStatus({ kind: 'error', msg: 'تعذّر الاتصال بالخادم.' });
    } finally { setNameBusy(false); }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwStatus(null);
    setPwBusy(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setPwStatus({ kind: 'error', msg: data.error ?? 'تعذّر التغيير.' });
      else { setPwStatus({ kind: 'ok', msg: 'تم تغيير كلمة المرور.' }); setCurrent(''); setNext(''); }
    } catch {
      setPwStatus({ kind: 'error', msg: 'تعذّر الاتصال بالخادم.' });
    } finally { setPwBusy(false); }
  }

  return (
    <>
      <form className="org-form" onSubmit={saveName}>
        {nameStatus && <div className={`org-alert ${nameStatus.kind === 'ok' ? 'is-ok' : ''}`}>{nameStatus.msg}</div>}
        <div className="pf-avatar-row">
          <span className="pf-avatar">
            {avatarUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" />
            ) : (
              (name.trim().charAt(0) || '؟')
            )}
          </span>
          <div className="org-field" style={{ flex: 1, margin: 0 }}>
            <label htmlFor="pf-avatar">رابط الصورة الشخصية</label>
            <input id="pf-avatar" dir="ltr" placeholder="https://example.com/photo.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            <span className="org-hint">الصق رابط صورة (يبدأ بـ http). اتركه فارغًا لإزالتها.</span>
          </div>
        </div>
        <div className="org-field">
          <label htmlFor="pf-name">الاسم</label>
          <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
        </div>
        <div className="org-field">
          <label htmlFor="pf-email">البريد الإلكتروني</label>
          <input id="pf-email" dir="ltr" value={email} readOnly />
          <span className="org-hint">يُدار من قِبل إدارة المؤسسة.</span>
        </div>
        <div className="org-kv"><span>الدور</span><strong>{roleLabel(role)}</strong></div>
        <div className="org-form-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={nameBusy || (name.trim() === initialName.trim() && avatarUrl.trim() === (initialAvatar ?? '').trim())}>
            {nameBusy ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>

      <h2 className="org-settings-h2">كلمة المرور</h2>
      <form className="org-form" onSubmit={changePassword}>
        {pwStatus && <div className={`org-alert ${pwStatus.kind === 'ok' ? 'is-ok' : ''}`}>{pwStatus.msg}</div>}
        <div className="org-field">
          <label htmlFor="pf-current">كلمة المرور الحالية</label>
          <input id="pf-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div className="org-field">
          <label htmlFor="pf-next">كلمة المرور الجديدة <span className="org-hint">8 محارف على الأقل</span></label>
          <input id="pf-next" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
        <div className="org-form-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={pwBusy || !current || next.length < 8}>
            {pwBusy ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </form>
    </>
  );
}

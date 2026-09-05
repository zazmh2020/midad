'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';
import { COUNTRIES } from '@/lib/countries';

/** يفصل رقمًا مخزّنًا "+966 5xxxx" إلى مفتاح دولة ورقم محلّي. */
function splitPhone(raw: string): { dial: string; number: string } {
  const val = (raw ?? '').trim();
  if (!val) return { dial: '+966', number: '' };
  const dials = [...COUNTRIES].map((c) => c.dial).sort((a, b) => b.length - a.length);
  const hit = dials.find((d) => val.startsWith(d));
  if (hit) return { dial: hit, number: val.slice(hit.length).trim() };
  return { dial: '+966', number: val };
}

export default function ProfileForm({
  name: initialName, email, role, avatarUrl: initialAvatar = '',
  jobTitle: initialJob = '', phone: initialPhone = '',
}: { name: string; email: string; role: string; avatarUrl?: string | null; jobTitle?: string | null; phone?: string | null }) {
  const t = useT();
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? '');
  const [jobTitle, setJobTitle] = useState(initialJob ?? '');
  const initPhone = splitPhone(initialPhone ?? '');
  const [dial, setDial] = useState(initPhone.dial);
  const [phoneNum, setPhoneNum] = useState(initPhone.number);
  const phone = phoneNum.trim() ? `${dial} ${phoneNum.trim()}` : '';
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
        body: JSON.stringify({ name, avatarUrl, jobTitle, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setNameStatus({ kind: 'error', msg: data.error ?? t('form.saveErr') });
      else { setNameStatus({ kind: 'ok', msg: t('pf.savedProfile') }); router.refresh(); }
    } catch {
      setNameStatus({ kind: 'error', msg: t('form.netErr') });
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
      if (!res.ok) setPwStatus({ kind: 'error', msg: data.error ?? t('pf.pwChangeErr') });
      else { setPwStatus({ kind: 'ok', msg: t('pf.pwChanged') }); setCurrent(''); setNext(''); }
    } catch {
      setPwStatus({ kind: 'error', msg: t('form.netErr') });
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
            <label htmlFor="pf-avatar">{t('pf.avatarUrl')}</label>
            <input id="pf-avatar" dir="ltr" placeholder="https://example.com/photo.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            <span className="org-hint">{t('pf.avatarHint')}</span>
          </div>
        </div>
        <div className="org-field-row">
          <div className="org-field">
            <label htmlFor="pf-name">{t('pf.name')}</label>
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
          </div>
          <div className="org-field">
            <label htmlFor="pf-job">{t('pf.jobTitle')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="pf-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>
        <div className="org-field-row">
          <div className="org-field">
            <label htmlFor="pf-email">{t('pf.email')}</label>
            <input id="pf-email" dir="ltr" value={email} readOnly />
            <span className="org-hint">{t('pf.emailHint')}</span>
          </div>
          <div className="org-field">
            <label htmlFor="pf-phone">{t('pf.phone')}</label>
            <div className="pf-phone-row" dir="ltr">
              <select className="pf-dial" value={dial} onChange={(e) => setDial(e.target.value)} aria-label={t('pf.phoneHint')}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>{c.flag} {c.dial} {c.name}</option>
                ))}
              </select>
              <input id="pf-phone" type="tel" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} placeholder="5X XXX XXXX" />
            </div>
          </div>
        </div>
        <div className="org-kv"><span>{t('pf.role')}</span><strong>{t(`role.${role}`)}</strong></div>
        <div className="org-form-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={nameBusy || (name.trim() === initialName.trim() && avatarUrl.trim() === (initialAvatar ?? '').trim() && jobTitle.trim() === (initialJob ?? '').trim() && phone.trim() === (initialPhone ?? '').trim())}>
            {nameBusy ? t('form.saving') : t('pf.saveChanges')}
          </button>
        </div>
      </form>

      <h2 className="org-settings-h2">{t('pf.password')}</h2>
      <form className="org-form" onSubmit={changePassword}>
        {pwStatus && <div className={`org-alert ${pwStatus.kind === 'ok' ? 'is-ok' : ''}`}>{pwStatus.msg}</div>}
        <div className="org-field">
          <label htmlFor="pf-current">{t('pf.currentPw')}</label>
          <input id="pf-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div className="org-field">
          <label htmlFor="pf-next">{t('pf.newPw')} <span className="org-hint">{t('pf.pwHint')}</span></label>
          <input id="pf-next" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
        <div className="org-form-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={pwBusy || !current || next.length < 8}>
            {pwBusy ? t('pf.changing') : t('pf.changePw')}
          </button>
        </div>
      </form>
    </>
  );
}

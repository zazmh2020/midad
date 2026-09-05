'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Announcement { id: string; title: string; body: string; createdAt: string; }

interface SiteInfo { aboutText: string; contactEmail: string; contactPhone: string; address: string; }

export default function ContentView({ announcements, slug, sitePublished, info }: { announcements: Announcement[]; slug: string; sitePublished: boolean; info: SiteInfo }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [published, setPublished] = useState(sitePublished);
  const [pubBusy, setPubBusy] = useState(false);
  const [about, setAbout] = useState(info.aboutText);
  const [cEmail, setCEmail] = useState(info.contactEmail);
  const [cPhone, setCPhone] = useState(info.contactPhone);
  const [addr, setAddr] = useState(info.address);
  const [infoBusy, setInfoBusy] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  async function saveInfo(e: FormEvent) {
    e.preventDefault(); setInfoBusy(true); setInfoSaved(false);
    try {
      const res = await fetch('/api/org/site', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aboutText: about, contactEmail: cEmail, contactPhone: cPhone, address: addr }),
      });
      if (res.ok) { setInfoSaved(true); router.refresh(); }
    } finally { setInfoBusy(false); }
  }

  async function togglePublish() {
    setPubBusy(true);
    const next = !published;
    try {
      const res = await fetch('/api/org/site', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: next }),
      });
      if (res.ok) { setPublished(next); router.refresh(); }
    } finally { setPubBusy(false); }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (title.trim().length < 2 || body.trim().length < 2) { setErr(t('content.fillErr')); return; }
    setBusy(true);
    const res = await fetch('/api/org/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    setBusy(false);
    if (res.ok) { setTitle(''); setBody(''); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? t('content.publishErr')); }
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
          <div className="org-field"><label>{t('content.titleLabel')}</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('content.titlePh')} /></div>
          <div className="org-field"><label>{t('content.bodyLabel')}</label><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('content.bodyPh')} /></div>
          <div className="org-form-actions"><button className="org-btn org-btn-primary" disabled={busy}>{busy ? t('content.publishing') : t('content.publish')}</button></div>
        </form>

        <div className="content-list">
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{t('content.none')}</p>
          ) : announcements.map((a) => (
            <div key={a.id} className="ann-card">
              <div className="ann-card-hd"><strong>{a.title}</strong></div>
              <p>{a.body}</p>
              <div className="ann-card-foot">
                <span>{dateFmt.format(new Date(a.createdAt))}</span>
                <button className="ann-del" onClick={() => remove(a.id)} disabled={busy}>{t('view.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-side">
        <div className="site-card">
          <h3>{t('content.siteTitle')}</h3>
          <p>{t('content.siteDesc')}</p>
          <label className="site-toggle">
            <input type="checkbox" checked={published} disabled={pubBusy} onChange={togglePublish} /> {t('content.sitePublish')}
            <span className={`site-badge ${published ? 'is-live' : ''}`}>{published ? t('content.siteLive') : t('content.siteOff')}</span>
          </label>
          {published && (
            <a className="site-link" href={`/site/${slug}`} target="_blank" rel="noreferrer">{t('content.siteView')} ↗</a>
          )}
        </div>

        <form className="site-card site-info" onSubmit={saveInfo}>
          <h3>{t('content.infoTitle')}</h3>
          <label className="site-in"><span>{t('content.about')}</span>
            <textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} /></label>
          <label className="site-in"><span>{t('content.cEmail')}</span>
            <input type="email" dir="ltr" value={cEmail} onChange={(e) => setCEmail(e.target.value)} /></label>
          <label className="site-in"><span>{t('content.cPhone')}</span>
            <input dir="ltr" value={cPhone} onChange={(e) => setCPhone(e.target.value)} /></label>
          <label className="site-in"><span>{t('content.address')}</span>
            <input value={addr} onChange={(e) => setAddr(e.target.value)} /></label>
          <button type="submit" className="org-btn org-btn-white site-save" disabled={infoBusy}>
            {infoBusy ? t('form.saving') : infoSaved ? t('form.saved') : t('form.save')}
          </button>
        </form>
        <div className="ann-card">
          <div className="ann-card-hd"><strong>{t('content.tipTitle')}</strong></div>
          <p>{t('content.tipDesc')}</p>
          <div className="ann-card-foot"><span><Icon name="documents/documents-documents" size={14} /> {t('content.manage')}</span></div>
        </div>
      </div>
    </div>
  );
}

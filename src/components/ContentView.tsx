'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Announcement { id: string; title: string; body: string; createdAt: string; }

export default function ContentView({ announcements }: { announcements: Announcement[] }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
            <input type="checkbox" disabled /> {t('content.sitePublish')} <span style={{ opacity: 0.7 }}>{t('content.soon')}</span>
          </label>
        </div>
        <div className="ann-card">
          <div className="ann-card-hd"><strong>{t('content.tipTitle')}</strong></div>
          <p>{t('content.tipDesc')}</p>
          <div className="ann-card-foot"><span><Icon name="documents/documents-documents" size={14} /> {t('content.manage')}</span></div>
        </div>
      </div>
    </div>
  );
}

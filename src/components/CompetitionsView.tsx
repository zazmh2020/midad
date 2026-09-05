'use client';

import Link from 'next/link';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Competition {
  id: string; name: string; level: string | null; status: string; startDate: string | null;
}

const STATUS_KIND: Record<string, 'ok' | 'warn' | 'muted'> = {
  UPCOMING: 'warn',
  OPEN: 'ok',
  CLOSED: 'muted',
};

export default function CompetitionsView({ competitions, basePath }: { competitions: Competition[]; basePath: string }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const router = useRouter();
  const [active, setActive] = useState<string>(competitions[0]?.id ?? 'new');
  const [creating, setCreating] = useState(competitions.length === 0);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const cur = competitions.find((c) => c.id === active);

  async function create(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (name.trim().length < 2) { setErr(t('comp.nameErr')); return; }
    setBusy(true);
    const res = await fetch('/api/org/competitions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, level, startDate: startDate || null, status }),
    });
    setBusy(false);
    if (res.ok) { setName(''); setLevel(''); setStartDate(''); setStatus('UPCOMING'); setCreating(false); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? t('form.createErr')); }
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/org/competitions?id=${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="hub">
      <div className="hub-list">
        <button className={`hub-item ${creating ? 'is-active' : ''}`} onClick={() => setCreating(true)}>
          <span className="hub-item-ic"><Icon name="actions/actions-add" size={18} /></span>
          <span className="hub-item-tx"><span className="t">{t('comp.new')}</span><span className="s">{t('comp.newSub')}</span></span>
        </button>
        {competitions.map((c) => (
          <button
            key={c.id}
            className={`hub-item ${!creating && active === c.id ? 'is-active' : ''}`}
            onClick={() => { setActive(c.id); setCreating(false); }}
          >
            <span className="hub-item-ic"><Icon name="operations/operations-events" size={18} /></span>
            <span className="hub-item-tx"><span className="t">{c.name}</span><span className="s">{c.level ?? t('comp.general')}</span></span>
            <span className={`hub-tag ${STATUS_KIND[c.status] ?? 'muted'}`}>{STATUS_KIND[c.status] ? t(`status.competition.${c.status}`) : c.status}</span>
          </button>
        ))}
      </div>

      <div className="hub-panel">
        <AnimatePresence mode="wait">
          {creating ? (
            <motion.div key="new" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <form className="mod-detail" onSubmit={create}>
                <div className="mod-detail-hd">
                  <span className="mod-detail-ic"><Icon name="operations/operations-events" size={22} /></span>
                  <div><h3>{t('comp.new')}</h3><p>{t('comp.newFormSub')}</p></div>
                </div>
                {err && <div className="org-alert" style={{ marginBottom: '0.8rem' }}>{err}</div>}
                <div className="org-field"><label>{t('comp.nameLabel')}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('comp.namePh')} /></div>
                <div className="org-field"><label>{t('comp.level')}</label><input value={level} onChange={(e) => setLevel(e.target.value)} placeholder={t('comp.levelPh')} /></div>
                <div className="org-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div className="org-field"><label>{t('view.startDate')}</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div className="org-field"><label>{t('view.status')}</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="UPCOMING">{t('status.competition.UPCOMING')}</option><option value="OPEN">{t('status.competition.OPEN')}</option><option value="CLOSED">{t('status.competition.CLOSED')}</option>
                    </select>
                  </div>
                </div>
                <div className="org-form-actions"><button className="org-btn org-btn-primary" disabled={busy}>{busy ? t('form.saving') : t('comp.create')}</button></div>
              </form>
            </motion.div>
          ) : cur ? (
            <motion.div key={cur.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="mod-detail">
                <div className="mod-detail-hd">
                  <span className="mod-detail-ic"><Icon name="operations/operations-events" size={22} /></span>
                  <div><h3>{cur.name}</h3><p>{cur.level ?? t('comp.generalComp')}</p></div>
                </div>
                <div className="mod-kpis">
                  <div className="mod-kpi"><div className="k">{t('view.status')}</div><div className="v" style={{ fontSize: '1rem' }}>{STATUS_KIND[cur.status] ? t(`status.competition.${cur.status}`) : cur.status}</div></div>
                  <div className="mod-kpi"><div className="k">{t('view.startDate')}</div><div className="v" style={{ fontSize: '0.9rem' }}>{cur.startDate ? dateFmt.format(new Date(cur.startDate)) : '—'}</div></div>
                  <div className="mod-kpi"><div className="k">{t('comp.level')}</div><div className="v" style={{ fontSize: '0.9rem' }}>{cur.level ?? t('comp.general')}</div></div>
                </div>
                <div className="org-form-actions">
                  <Link className="org-btn org-btn-primary" href={`${basePath}/${cur.id}`}>{t('comp.manageParticipants')}</Link>
                  <button className="org-btn org-btn-danger" onClick={() => remove(cur.id)} disabled={busy}>{t('comp.delete')}</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mod-detail"><p style={{ color: 'var(--gray-500)' }}>{t('comp.empty')}</p></div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import Reveal from '@/components/Reveal';
import Mockup, { type MockKind } from './Mockup';
import { useT } from '@/lib/i18n/LocaleProvider';

interface Item {
  kind: MockKind;
  k: string;
}

const ITEMS: Item[] = [
  { kind: 'dashboard', k: 'prod.dashboard' },
  { kind: 'hr', k: 'prod.hr' },
  { kind: 'projects', k: 'prod.projects' },
  { kind: 'education', k: 'prod.education' },
  { kind: 'beneficiaries', k: 'prod.beneficiaries' },
  { kind: 'reports', k: 'prod.reports' },
];

const CHECK = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
);

export default function ProductShowcase() {
  const t = useT();
  return (
    <div className="mdl-shows">
      {ITEMS.map((it, i) => (
        <Reveal key={it.k} y={28}>
          {/* صفوف متبادلة: نقطة يمين/صورة يسار، ثم العكس */}
          <div className={`mdl-show-row ${i % 2 ? 'rev' : ''}`}>
            <div className="mdl-show-text">
              <span className="mdl-sd-badge">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t(`${it.k}.t`)}</h3>
              <p>{t(`${it.k}.d`)}</p>
              <ul>{['p1', 'p2', 'p3'].map((p) => <li key={p}>{CHECK}<span>{t(`${it.k}.${p}`)}</span></li>)}</ul>
            </div>
            <div className="mdl-show-media">
              <Mockup kind={it.kind} />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

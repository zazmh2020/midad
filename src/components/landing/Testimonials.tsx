'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '@/lib/i18n/LocaleProvider';

const KEYS = ['story.1', 'story.2', 'story.3', 'story.4'];

export default function Testimonials() {
  const t = useT();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % KEYS.length), 5200);
    return () => clearInterval(id);
  }, [paused]);

  const k = KEYS[i];
  const s = {
    stat: t(`${k}.stat`), unit: t(`${k}.unit`), quote: t(`${k}.quote`),
    name: t(`${k}.name`), role: t(`${k}.role`), org: t(`${k}.org`),
  };

  return (
    <div className="mdl-stories" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mdl-stories-stage">
        <AnimatePresence mode="wait">
          <motion.article
            key={i}
            className="mdl-story"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="mdl-story-body">
              <div className="mdl-story-stat">{s.stat}<span>{s.unit}</span></div>
              <p className="mdl-story-quote">”{s.quote}“</p>
              <div className="mdl-story-author">
                <span className="mdl-story-av">{s.name.charAt(0)}</span>
                <span><strong>{s.name}</strong><span>{s.role} · {s.org}</span></span>
              </div>
            </div>
            <div className="mdl-story-emblem">
              <span className="mdl-story-org-mark">{s.org.charAt(0)}</span>
              <span className="mdl-story-org-name">{s.org}</span>
              <svg className="mdl-story-quotemark" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M17 8c-6 2-9 7-9 14v10h11V20h-6c0-4 2-7 6-8zM38 8c-6 2-9 7-9 14v10h11V20h-6c0-4 2-7 6-8z"/></svg>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* شريط القصص القابل للاختيار */}
      <div className="mdl-stories-nav">
        {KEYS.map((sk, idx) => (
          <button
            key={sk}
            className={`mdl-story-chip ${idx === i ? 'is-active' : ''}`}
            onClick={() => setI(idx)}
            aria-label={t(`${sk}.org`)}
          >
            <span className="mdl-story-chip-av">{t(`${sk}.name`).charAt(0)}</span>
            <span className="mdl-story-chip-org">{t(`${sk}.org`)}</span>
          </button>
        ))}
      </div>

      <div className="mdl-stories-dots">
        {KEYS.map((sk, idx) => (
          <button key={sk} className={idx === i ? 'is-active' : ''} onClick={() => setI(idx)} aria-label={t(`${sk}.org`)} />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface HubItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  tagKind?: 'ok' | 'warn' | 'muted';
  icon?: ReactNode;
  detail: ReactNode;
}

/**
 * متصفّح تفاعلي (نمط Calendly v2): قائمة على اليمين ↔ لوحة متزامنة على اليسار
 * تتبدّل بحركة سلسة عند الاختيار، مع حالات active/inactive واضحة.
 */
export default function HubBrowser({ items, aside }: { items: HubItem[]; aside?: ReactNode }) {
  const [active, setActive] = useState(0);
  const cur = items[active] ?? items[0];

  return (
    <div className="hub">
      <div className="hub-list" role="tablist">
        {aside}
        {items.map((it, i) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={i === active}
            className={`hub-item ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
          >
            {it.icon && <span className="hub-item-ic">{it.icon}</span>}
            <span className="hub-item-tx">
              <span className="t">{it.title}</span>
              {it.subtitle && <span className="s">{it.subtitle}</span>}
            </span>
            {it.tag && <span className={`hub-tag ${it.tagKind ?? ''}`}>{it.tag}</span>}
          </button>
        ))}
      </div>

      <div className="hub-panel">
        <AnimatePresence mode="wait">
          <motion.div
            key={cur?.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {cur?.detail}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

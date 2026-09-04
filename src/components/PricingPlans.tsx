'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLANS, CURRENCY, yearlyPrice } from '@/lib/plans';

const fmt = new Intl.NumberFormat('en-US');

export default function PricingPlans() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="pricing-wrap">
      {/* مفتاح التبديل شهري / سنوي */}
      <div className="billing-toggle" role="group" aria-label="دورة الفوترة">
        <button
          type="button"
          className={`billing-opt ${!yearly ? 'is-active' : ''}`}
          onClick={() => setYearly(false)}
          aria-pressed={!yearly}
        >
          شهري
        </button>
        <button
          type="button"
          className={`billing-opt ${yearly ? 'is-active' : ''}`}
          onClick={() => setYearly(true)}
          aria-pressed={yearly}
        >
          سنوي
          <span className="billing-save">وفّر شهرين</span>
        </button>
      </div>

      <div className="pricing-grid">
        {PLANS.map((p) => {
          const year = yearlyPrice(p);
          const isPaid = p.price !== null && p.price > 0;
          return (
            <article key={p.id} className={`plan-card ${p.highlighted ? 'is-featured' : ''}`}>
              {p.highlighted && <span className="plan-badge">الأكثر طلبًا</span>}
              <h3 className="plan-name">{p.name}</h3>
              <p className="plan-tagline">{p.tagline}</p>

              <div className="plan-price">
                {p.price === null ? (
                  <span className="plan-custom">تسعير مخصّص</span>
                ) : p.price === 0 ? (
                  <span className="plan-custom">مجانًا</span>
                ) : yearly ? (
                  <>
                    <span className="plan-amount">{fmt.format(year as number)}</span>
                    <span className="plan-period">{CURRENCY} / سنة</span>
                    <span className="plan-permonth">
                      ≈ {fmt.format(Math.round((year as number) / 12))} {CURRENCY} / شهر
                    </span>
                  </>
                ) : (
                  <>
                    <span className="plan-amount">{fmt.format(p.price)}</span>
                    <span className="plan-period">{CURRENCY} / شهر</span>
                  </>
                )}
              </div>

              <ul className="plan-features">
                {p.features.map((f) => (
                  <li key={f}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
                    {f}
                  </li>
                ))}
              </ul>

              {p.price === 0 ? (
                <Link href="/login" className={`plan-cta ${p.highlighted ? 'is-primary' : ''}`}>ابدأ مجانًا</Link>
              ) : (
                <a href="#contact" className={`plan-cta ${p.highlighted ? 'is-primary' : ''}`}>
                  {isPaid ? 'اشترك الآن' : 'تواصل معنا'}
                </a>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';

const SYSTEMS_MEGA = [
  { icon: 'people/people-users', t: 'إدارة الأفراد', d: 'موظفون ومتطوعون ومستفيدون بأدوارهم.' },
  { icon: 'operations/operations-projects', t: 'المشاريع والبرامج', d: 'مراحل ومهام ومتابعة إنجاز.' },
  { icon: 'finance/finance-donations', t: 'المالية والتبرعات', d: 'متبرعون وحملات وتقارير مالية.', gold: true },
  { icon: 'people/people-beneficiaries', t: 'المستفيدون', d: 'سجل الحالات والخدمات المقدَّمة.' },
  { icon: 'analytics/analytics-analytics', t: 'التقارير والتحليلات', d: 'مؤشرات ورسوم من بياناتك.' },
  { icon: 'ai/ai-ai-assistant', t: 'مِداد AI', d: 'بحث وتحليل ضمن الصلاحيات.', gold: true },
];

const JIHAT_MEGA = [
  { icon: 'organization/organization-institution', t: 'الجمعيات الخيرية', d: 'مستفيدون ومشاريع وتبرعات.' },
  { icon: 'education/education-quran', t: 'مراكز القرآن', d: 'حلقات وحفظ وتسميع وشهادات.', gold: true },
  { icon: 'education/education-education', t: 'المراكز التعليمية', d: 'صفوف وتقييمات وحضور.' },
  { icon: 'people/people-groups', t: 'المؤسسات الإنسانية', d: 'برامج ميدانية وفرق عمل.' },
];

const chev = (
  <svg className="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5" /></svg>
);

function Mega({ items, href, wide }: { items: typeof SYSTEMS_MEGA; href: string; wide?: boolean }) {
  return (
    <div className={`mdl-mega ${wide ? '' : 'narrow'}`}>
      {items.map((it) => (
        <a key={it.t} href={href} className="mdl-mega-item">
          <span className={`mdl-mega-ic ${it.gold ? 'gold' : ''}`}><Icon name={it.icon} size={19} /></span>
          <span className="mdl-mega-tx"><span className="t">{it.t}</span><span className="d">{it.d}</span></span>
        </a>
      ))}
    </div>
  );
}

export default function MidadHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`mdl-header ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="mdl-navbar" aria-label="التنقل الرئيسي">
        <a href="#home" className="mdl-brand" aria-label="مِداد">
          <LogoMark size={26} className="mark" />
          <span className="name">مِداد</span>
        </a>

        <div className="mdl-nav-links">
          <a href="#home" className="mdl-nav-link">الرئيسية</a>
          <div className="mdl-has-menu">
            <a href="#systems" className="mdl-nav-link">الأنظمة {chev}</a>
            <Mega items={SYSTEMS_MEGA} href="#systems" wide />
          </div>
          <div className="mdl-has-menu">
            <a href="#platform" className="mdl-nav-link">الجهات {chev}</a>
            <Mega items={JIHAT_MEGA} href="#platform" />
          </div>
          <a href="#platform" className="mdl-nav-link">المنصة</a>
          <a href="#ai" className="mdl-nav-link">مِداد AI</a>
          <a href="#about" className="mdl-nav-link">عن مِداد</a>
        </div>

        <div className="mdl-nav-actions">
          <Link href="/login" className="mdl-btn mdl-btn-white">تسجيل الدخول</Link>
          <button className="mdl-menu-btn" aria-label="القائمة" onClick={() => setOpen(true)}>
            <svg width="24" height="18" viewBox="0 0 26 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M1 1h24M1 10h24M1 19h24" /></svg>
          </button>
        </div>
      </nav>

      <div className={`mdl-drawer ${open ? 'is-open' : ''}`}>
        <div className="mdl-drawer-scrim" onClick={() => setOpen(false)} />
        <div className="mdl-drawer-panel">
          <div className="mdl-drawer-head">
            <span className="mdl-brand"><LogoMark size={26} className="mark" style={{ color: 'var(--p)' }} /><span className="name" style={{ color: 'var(--dark)' }}>مِداد</span></span>
            <button className="mdl-menu-btn" aria-label="إغلاق" style={{ color: 'var(--text)', display: 'inline-flex' }} onClick={() => setOpen(false)}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l14 14M18 4L4 18" /></svg>
            </button>
          </div>
          {[['#home', 'الرئيسية'], ['#systems', 'الأنظمة'], ['#platform', 'المنصة'], ['#ai', 'مِداد AI'], ['#about', 'عن مِداد']].map(([h, l]) => (
            <a key={l} href={h} onClick={() => setOpen(false)}>{l}</a>
          ))}
          <Link href="/login" className="mdl-btn mdl-btn-primary" onClick={() => setOpen(false)}>تسجيل الدخول</Link>
        </div>
      </div>
    </header>
  );
}

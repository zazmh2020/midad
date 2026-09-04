'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import type { SessionData } from '@/lib/session';
import { LogoMark } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

interface Props {
  children: ReactNode;
  session: SessionData;
  avatarUrl?: string | null;
}

// ربط مفاتيح التنقّل بنظام أيقونات مِداد (public/icons)
const ICONS = {
  home: 'navigation/navigation-dashboard',
  building: 'organization/organization-institution',
  settings: 'navigation/navigation-settings',
  logout: 'navigation/navigation-logout',
} as const;

const navItems = [
  { href: '/admin', label: 'نظرة عامة', icon: 'home' as const },
  { href: '/admin/organizations', label: 'المؤسسات', icon: 'building' as const },
  { href: '/admin/settings', label: 'الإعدادات', icon: 'settings' as const },
];

function Icon({ name }: { name: keyof typeof ICONS }) {
  const url = `url(/icons/${ICONS[name]}.svg)`;
  return (
    <span
      aria-hidden="true"
      className="app-icon admin-nav-ic"
      style={{ WebkitMaskImage: url, maskImage: url }}
    />
  );
}

export default function AdminShell({ children, session, avatarUrl }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    // بعد الخروج، انتقل إلى صفحة الدخول على الدومين الرئيسي
    window.location.href = 'http://midad.localhost:3000/login';
  }

  return (
    <div className="admin-app">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <LogoMark size={22} />
          </div>
          <div>
            <div className="admin-brand-name">مِداد</div>
            <div className="admin-brand-role">لوحة الإدارة</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-foot">
          {profileOpen && (
            <div className="admin-profile-menu">
              <div className="admin-profile-head">
                <span className="admin-profile-name">{session.name}</span>
                <span className="admin-profile-email" dir="ltr">{session.email}</span>
              </div>
              <Link href="/admin/settings" className="admin-profile-link" onClick={() => setProfileOpen(false)}>
                <Icon name="settings" />
                <span>الملف الشخصي والإعدادات</span>
              </Link>
              <button className="admin-profile-link admin-profile-logout" onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}>
                <Icon name="logout" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
          <button className="admin-user" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen}>
            <span className="admin-user-avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" />
              ) : (
                session.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="admin-user-info">
              <span className="admin-user-name">{session.name}</span>
              <span className="admin-user-email" dir="ltr">{session.email}</span>
              <span className="admin-user-role">مالك المنصة</span>
            </span>
            <svg className="admin-user-chev" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12l4-4 4 4" /></svg>
          </button>
        </div>
      </aside>

      {confirmLogout && (
        <div className="admin-modal-scrim" onClick={() => setConfirmLogout(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-ic"><Icon name="logout" /></div>
            <h3>تأكيد تسجيل الخروج</h3>
            <p>هل تريد بالتأكيد تسجيل الخروج من حسابك؟</p>
            <div className="admin-modal-actions">
              <button className="btn-admin-outline" onClick={() => setConfirmLogout(false)} disabled={busy}>إلغاء</button>
              <button className="btn-admin-danger" onClick={handleLogout} disabled={busy}>
                {busy ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="القائمة"
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1h18M1 7h18M1 13h18" />
            </svg>
          </button>
          <div className="admin-topbar-title">لوحة تحكم مالك المنصة</div>
          <ThemeToggle className="admin-topbar-theme" />
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

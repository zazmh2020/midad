'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import TopbarTools, { type SearchItem } from '@/components/TopbarTools';
import WelcomeBack from '@/components/WelcomeBack';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { OrgInbox } from '@/lib/inbox';
import '@/styles/welcome.css';

/* اشتقاق تدرّج بنفسجي مخصّص من لون هوية الجهة */
function hexToRgb(h: string): [number, number, number] {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
function brandVars(hex?: string | null): CSSProperties | undefined {
  if (!hex || !/^#?[0-9a-fA-F]{3,6}$/.test(hex)) return undefined;
  try {
    const [r, g, b] = hexToRgb(hex);
    const dark = (f: number) => toHex(r * f, g * f, b * f);
    const light = (f: number) => toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
    return {
      '--purple-500': hex.startsWith('#') ? hex : `#${hex}`,
      '--purple-700': dark(0.72),
      '--purple-900': dark(0.5),
      '--purple-300': light(0.32),
      '--purple-100': light(0.68),
    } as CSSProperties;
  } catch {
    return undefined;
  }
}

export type NavEntry =
  | { kind: 'divider'; label: string }
  | { kind: 'link'; href: string; label: string; icon: keyof typeof ICONS; match?: string[] };

interface Props {
  children: ReactNode;
  org: { name: string; slug: string; brandColor?: string | null; logoUrl?: string | null };
  user: { name: string; role: string; email?: string; avatarUrl?: string | null; jobTitle?: string | null };
  nav: NavEntry[];
  inbox: OrgInbox;
}

// ربط مفاتيح التنقّل بنظام أيقونات مِداد (public/icons)
const ICONS = {
  home: 'navigation/navigation-dashboard',
  users: 'people/people-users',
  projects: 'operations/operations-projects',
  structure: 'organization/organization-structure',
  programs: 'operations/operations-programs',
  campaigns: 'operations/operations-campaigns',
  donations: 'finance/finance-donations',
  beneficiaries: 'people/people-beneficiaries',
  knowledge: 'education/education-learning',
  documents: 'documents/documents-documents',
  assistant: 'ai/ai-ai-assistant',
  reports: 'analytics/analytics-analytics',
  statistics: 'analytics/analytics-statistics',
  organization: 'organization/organization-institution',
  operations: 'operations/operations-activities',
  resources: 'people/people-groups',
  education: 'education/education-education',
  plans: 'education/education-curriculum',
  competitions: 'operations/operations-events',
  certificates: 'identity/identity-certificate',
  content: 'documents/documents-document-management',
  identity: 'identity/identity-digital-identity',
  admin: 'administration/administration-system-settings',
  settings: 'navigation/navigation-settings',
  logout: 'navigation/navigation-logout',
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  const url = `url(/icons/${ICONS[name]}.svg)`;
  return (
    <span
      aria-hidden="true"
      className="app-icon org-nav-ic"
      style={{ WebkitMaskImage: url, maskImage: url }}
    />
  );
}

/** صورة المستخدم — صورة مرفوعة أو أيقونة شخص افتراضية. */
function Avatar({ url }: { url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" />;
  }
  return (
    <svg className="ava-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z" />
    </svg>
  );
}

export default function OrgShell({ children, org, user, nav, inbox }: Props) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem('midad_sidebar_collapsed') === '1'); } catch { /* */ }
  }, []);
  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('midad_sidebar_collapsed', next ? '1' : '0'); } catch { /* */ }
      return next;
    });
  }

  const base = `/org/${org.slug}`;

  async function handleLogout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  function isActive(href: string, match?: string[]) {
    if (href === base) return pathname === base;
    if (match?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // عناصر البحث مشتقّة من التنقّل (مع القسم من الفاصل السابق)
  const searchItems: SearchItem[] = [];
  let section: string | undefined;
  for (const entry of nav) {
    if (entry.kind === 'divider') section = entry.label;
    else searchItems.push({ label: entry.label, href: entry.href, section });
  }

  return (
    <div className={`org-app ${collapsed ? 'is-collapsed' : ''}`} style={brandVars(org.brandColor)}>
      <WelcomeBack name={user.name} greeting={t('welcome.greeting')} />
      <aside className={`org-sidebar ${open ? 'is-open' : ''}`}>
        {/* زر طيّ/فرد الشريط الجانبي (ضمن القائمة نفسها) */}
        <button
          className="org-fold-toggle"
          onClick={toggleCollapsed}
          aria-label={t('shell.foldSidebar')}
          aria-pressed={collapsed}
          title={t('shell.foldSidebar')}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <path d="M4 5h12M4 10h12M4 15h12" />
              : <><rect x="2.5" y="3.5" width="15" height="13" rx="2" /><path d="M12.5 3.5v13" /></>}
          </svg>
        </button>
        {/* ملف المستخدم أعلى الشريط — للعرض فقط */}
        <div className="org-side-profile">
          <div className="org-user org-user-stacked">
            <span className="org-user-avatar org-user-avatar-lg">
              <Avatar url={user.avatarUrl} />
            </span>
            <span className="org-user-name">{user.name}</span>
            <span className="org-user-role">{t(`role.${user.role}`)}</span>
          </div>
        </div>

        <nav className="org-nav">
          {nav.map((entry, i) =>
            entry.kind === 'divider' ? (
              <div key={`d-${i}`} className="org-nav-divider">{entry.label}</div>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={`org-nav-item ${isActive(entry.href, entry.match) ? 'is-active' : ''}`}
                onClick={() => setOpen(false)}
                title={entry.label}
              >
                <Icon name={entry.icon} />
                <span>{entry.label}</span>
              </Link>
            ),
          )}
        </nav>
      </aside>

      {confirmLogout && (
        <div className="org-modal-scrim" onClick={() => setConfirmLogout(false)}>
          <div className="org-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="org-modal-ic"><Icon name="logout" /></div>
            <h3>{t('shell.logout.confirm.title')}</h3>
            <p>{t('shell.logout.confirm.body')}</p>
            <div className="org-modal-actions">
              <button className="org-btn org-btn-outline" onClick={() => setConfirmLogout(false)} disabled={busy}>{t('shell.cancel')}</button>
              <button className="org-btn org-btn-danger" onClick={handleLogout} disabled={busy}>
                {busy ? t('shell.loggingOut') : t('shell.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && <div className="org-scrim" onClick={() => setOpen(false)} />}

      <div className="org-main">
        <header className="org-topbar">
          <button className="org-menu-toggle" onClick={() => setOpen(true)} aria-label={t('shell.menu')}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1h18M1 7h18M1 13h18" />
            </svg>
          </button>
          <Link href={base} className="org-topbar-brand" onClick={() => setOpen(false)}>
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" className="org-brand-logo-img" />
            ) : (
              <LogoMark size={22} className="org-brand-logo" />
            )}
            <span className="org-topbar-name">{org.name}</span>
          </Link>
          <TopbarTools
            searchItems={searchItems}
            messages={inbox.messages}
            notifications={inbox.notifications}
            storageKey={`midad_org_${org.slug}`}
          />
          <div className="org-topbar-profile">
            <button className="tbar-user" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} aria-label={t('shell.profile')}>
              <span className="tbar-user-ava"><Avatar url={user.avatarUrl} /></span>
              <span className="tbar-user-tx">
                <span className="tbar-user-name">{user.name}</span>
                <span className="tbar-user-role">{user.jobTitle || t(`role.${user.role}`)}</span>
              </span>
              <svg className="tbar-user-chev" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8l4 4 4-4" /></svg>
            </button>
            {profileOpen && (
              <>
                <div className="org-menu-backdrop" onClick={() => setProfileOpen(false)} />
                <div className="org-profile-menu org-profile-menu-top">
                  <div className="org-profile-head">
                    <span className="org-profile-name">{user.name}</span>
                    <span className="org-profile-role">{user.jobTitle || t(`role.${user.role}`)}</span>
                  </div>
                  <Link href={`${base}/settings`} className="org-profile-link" onClick={() => setProfileOpen(false)}>
                    <Icon name="settings" />
                    <span>{t('shell.profile')}</span>
                  </Link>
                  <button className="org-profile-link org-profile-logout" onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}>
                    <Icon name="logout" />
                    <span>{t('shell.logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="org-content">{children}</main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import TopbarTools, { type SearchItem } from '@/components/TopbarTools';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { OrgInbox } from '@/lib/inbox';

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
  user: { name: string; role: string; email?: string; avatarUrl?: string | null };
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

export default function OrgShell({ children, org, user, nav, inbox }: Props) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

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
    <div className="org-app" style={brandVars(org.brandColor)}>
      <aside className={`org-sidebar ${open ? 'is-open' : ''}`}>
        {/* ملف المستخدم أعلى الشريط */}
        <div className="org-side-profile">
          <button className="org-user" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen}>
            <span className="org-user-avatar">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" />
              ) : (
                user.name.charAt(0)
              )}
            </span>
            <span className="org-user-info">
              <span className="org-user-name">{user.name}</span>
              <span className="org-user-role">{t(`role.${user.role}`)}</span>
            </span>
            <svg className="org-user-chev" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8l4 4 4-4" /></svg>
          </button>
          {profileOpen && (
            <div className="org-profile-menu">
              <Link href={`${base}/settings`} className="org-profile-link" onClick={() => { setProfileOpen(false); setOpen(false); }}>
                <Icon name="settings" />
                <span>{t('shell.profile')}</span>
              </Link>
              <button className="org-profile-link org-profile-logout" onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}>
                <Icon name="logout" />
                <span>{t('shell.logout')}</span>
              </button>
            </div>
          )}
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
        </header>
        <main className="org-content">{children}</main>
      </div>
    </div>
  );
}

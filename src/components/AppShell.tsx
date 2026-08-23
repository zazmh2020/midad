import Link from 'next/link';
import LogoutButton from '@/app/app/LogoutButton';

const roleLabel: Record<string, string> = { PLATFORM_OWNER: 'مالك المنصة', ORG_ADMIN: 'مدير المنظمة', STAFF: 'موظف', MEMBER: 'عضو' };

export default function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; role: string } }) {
  return <div className="midad-shell"><aside className="midad-sidebar"><Link href="/app" className="midad-brand"><strong>مِداد</strong><small>MIDAD</small></Link><p className="nav-caption">مساحة العمل</p><nav><Link href="/app">نظرة عامة</Link>{user.role === 'PLATFORM_OWNER' && <Link href="/app/organizations">المنظمات</Link>}<Link href="/app/users">المستخدمون</Link></nav><div className="midad-profile"><b>{user.name.slice(0, 1)}</b><span>{user.name}<small>{roleLabel[user.role] ?? user.role}</small></span></div><LogoutButton /></aside><main className="midad-main">{children}</main></div>;
}

import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { PLAN_BY_ID } from '@/lib/plans';
import ProfileForm from '@/components/ProfileForm';
import OrgSettingsForm from '@/components/OrgSettingsForm';
import BrandingForm from '@/components/BrandingForm';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');

const TYPE_LABELS: Record<string, string> = {
  ASSOCIATION: 'جمعية / مؤسسة',
  MOSQUE: 'مسجد / مركز قرآني',
  SCHOOL: 'مركز تعليمي',
  PROJECT: 'مشروع خاص',
};

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const isAdmin = canManageSettings(user.role);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">النظام</span>
          <h1>الإعدادات</h1>
          <p>ملفّك الشخصي وتفضيلاتك{isAdmin ? ' وبيانات المؤسسة' : ''}.</p>
        </div>
      </div>

      <h2 className="org-settings-h2">الملف الشخصي</h2>
      <ProfileForm name={user.name} email={user.email} role={user.role} avatarUrl={user.avatarUrl} />

      <h2 className="org-settings-h2">التفضيلات</h2>
      <div className="org-panel">
        <div className="org-kv">
          <span>اللغة</span>
          <strong>العربية</strong>
        </div>
        <div className="org-kv">
          <span>المظهر</span>
          <span className="org-badge">قريبًا</span>
        </div>
        <div className="org-kv">
          <span>الإشعارات</span>
          <span className="org-badge">قريبًا</span>
        </div>
      </div>

      {isAdmin && (
        <>
          <h2 className="org-settings-h2">الباقة</h2>
          <div className="org-panel">
            <div className="org-kv">
              <span>الباقة الحالية</span>
              <strong>{PLAN_BY_ID[org.plan]?.name ?? org.plan}</strong>
            </div>
            <div className="org-kv">
              <span>حدّ المستخدمين</span>
              <strong>
                {PLAN_BY_ID[org.plan]?.maxUsers == null
                  ? 'بلا حدّ'
                  : numFmt.format(PLAN_BY_ID[org.plan]!.maxUsers!)}
              </strong>
            </div>
            <p className="org-panel-sub">
              لترقية باقتك تواصل مع مِداد أو راجع <Link href="/pricing" className="org-link">صفحة الأسعار</Link>.
            </p>
          </div>

          <h2 className="org-settings-h2">إعدادات المؤسسة</h2>
          <div className="org-panel">
            <div className="org-kv">
              <span>النوع</span>
              <strong>{TYPE_LABELS[org.type] ?? org.type}</strong>
            </div>
            <div className="org-kv">
              <span>الرابط الفرعي</span>
              <code dir="ltr">{org.slug}.midad.localhost:3000</code>
            </div>
            <p className="org-panel-sub">النوع والرابط الفرعي يُداران من قِبل مالك المنصة.</p>
          </div>
          <OrgSettingsForm name={org.name} />

          <h2 className="org-settings-h2">الهوية البصرية</h2>
          <p className="org-panel-sub" style={{ marginBottom: '0.8rem' }}>خصّص لون هوية جهتك وشعارها — ينعكس على مساحة العمل بالكامل.</p>
          <BrandingForm brandColor={org.brandColor} logoUrl={org.logoUrl} />
        </>
      )}

      <h2 className="org-settings-h2">الحساب</h2>
      <LogoutButton redirectTo="/login" />
    </div>
  );
}

import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const user = await requireUser();
  const owner = user.role === 'PLATFORM_OWNER';
  const [organizationCount, userCount] = await Promise.all([prisma.organization.count(), prisma.user.count()]);
  return <section className="workspace"><header className="page-heading"><div><span className="eyebrow">MIDAD DIGITAL PLATFORM</span><h1>مرحبًا، {user.name}</h1><p>إدارة آمنة ومنظمة لمساحة عملك.</p></div>{owner && <Link className="btn btn-primary" href="/app/organizations/new">إضافة منظمة</Link>}</header><div className="metric-grid"><article><span>{owner ? 'المنظمات' : 'منظمتك'}</span><strong>{owner ? organizationCount : user.organization?.name ?? '—'}</strong><small>{owner ? 'مساحة عمل مسجلة' : 'مساحة العمل الحالية'}</small></article><article><span>{owner ? 'المستخدمون' : 'دورك'}</span><strong>{owner ? userCount : user.role === 'ORG_ADMIN' ? 'مدير' : 'عضو'}</strong><small>{owner ? 'حساب على المنصة' : 'صلاحيات الحساب'}</small></article><article><span>الحالة</span><strong>مستقرة</strong><small>الخدمات الأساسية تعمل</small></article></div><article className="workspace-panel"><h2>الخطوات التالية</h2><div className="setup-list"><p><b>1</b><span>إعداد المنظمات ومساحات العمل<small>كل منظمة معزولة عن الأخرى.</small></span>{owner && <Link href="/app/organizations">إدارة</Link>}</p><p><b>2</b><span>إضافة المستخدمين وتحديد أدوارهم<small>إدارة الوصول من مكان واحد.</small></span><Link href="/app/users">إدارة</Link></p><p><b>3</b><span>تفعيل الوحدات التشغيلية<small>البرامج والمشاريع والمهام لاحقًا.</small></span><em>قريبًا</em></p></div></article></section>;
}

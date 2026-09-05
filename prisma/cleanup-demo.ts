import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/* ============================================================
   تنظيف البيانات التجريبية قبل الإطلاق الرسمي.
   يحذف الجهات التجريبية (وكل بياناتها بالتتالي) وحسابات
   التجربة، مع الإبقاء على أي حساب/جهة حقيقية.

   لا يعمل إلا بتأكيد صريح لتفادي الحذف غير المقصود:
     CONFIRM_CLEANUP=YES npx tsx prisma/cleanup-demo.ts
   ============================================================ */

const DEMO_ORG_SLUGS = ['alkhair', 'alquran', 'alnujum', 'athar'];
const DEMO_USER_EMAILS = [
  'owner@midad.local',
  'association@midad.local',
  'mosque@midad.local',
  'school@midad.local',
  'project@midad.local',
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (process.env.CONFIRM_CLEANUP !== 'YES') {
    console.log('⚠️  لم يُشغّل الحذف. للتأكيد شغّل:');
    console.log('    CONFIRM_CLEANUP=YES npx tsx prisma/cleanup-demo.ts\n');
    // عرض ما سيُحذف (تشغيل جاف)
    const orgs = await prisma.organization.findMany({ where: { slug: { in: DEMO_ORG_SLUGS } }, select: { slug: true, name: true } });
    const users = await prisma.user.findMany({ where: { email: { in: DEMO_USER_EMAILS } }, select: { email: true } });
    console.log('سيُحذف (تشغيل جاف):');
    console.log('  الجهات:', orgs.map((o) => o.slug).join(', ') || '—');
    console.log('  الحسابات:', users.map((u) => u.email).join(', ') || '—');
    return;
  }

  // حذف الجهات التجريبية — يتتالى الحذف على مستخدميها وبياناتها كافّة
  const delOrgs = await prisma.organization.deleteMany({ where: { slug: { in: DEMO_ORG_SLUGS } } });
  // حذف حسابات التجربة التي لا جهة لها (مثل مالك المنصة التجريبي)
  const delUsers = await prisma.user.deleteMany({ where: { email: { in: DEMO_USER_EMAILS } } });

  console.log(`✓ حُذفت ${delOrgs.count} جهة تجريبية و${delUsers.count} حساب تجريبي.`);
  console.log('احتفظ النظام بكل الجهات والحسابات الحقيقية الأخرى.');

  const remainingOrgs = await prisma.organization.count();
  const remainingUsers = await prisma.user.count();
  console.log(`المتبقّي: ${remainingOrgs} جهة، ${remainingUsers} حساب.`);
}

main()
  .catch((e) => { console.error('فشل التنظيف:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

import 'dotenv/config';
import { PrismaClient, Role, OrgType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/* ============================================================
   حسابات تجريبية — كلمة المرور الموحّدة للجميع: Demo1234!
   ============================================================ */

const OWNER = { name: 'مالك المنصة', email: 'owner@midad.local', password: 'Owner1234!' };
const DEMO_PASSWORD = 'Demo1234!';

const DEMO_ORGS: {
  name: string; slug: string; type: OrgType; brandColor: string;
  adminName: string; adminEmail: string;
}[] = [
  { name: 'جمعية الخير الخيرية', slug: 'alkhair', type: OrgType.ASSOCIATION, brandColor: '#6B57A0', adminName: 'مدير الجمعية', adminEmail: 'association@midad.local' },
  { name: 'مركز القرآن الكريم', slug: 'alquran', type: OrgType.MOSQUE, brandColor: '#1F7A5A', adminName: 'مشرف المركز', adminEmail: 'mosque@midad.local' },
  { name: 'مركز النجوم التعليمي', slug: 'alnujum', type: OrgType.SCHOOL, brandColor: '#2563EB', adminName: 'مدير المركز', adminEmail: 'school@midad.local' },
  { name: 'مشروع أثر الخاص', slug: 'athar', type: OrgType.PROJECT, brandColor: '#B45309', adminName: 'مدير المشروع', adminEmail: 'project@midad.local' },
];

async function main() {
  // مالك المنصة
  const owner = await prisma.user.upsert({
    where: { email: OWNER.email },
    update: {},
    create: {
      name: OWNER.name,
      email: OWNER.email,
      passwordHash: await bcrypt.hash(OWNER.password, 12),
      role: Role.PLATFORM_OWNER,
    },
  });
  console.log('✓ مالك المنصة: ' + owner.email + '  (كلمة المرور: ' + OWNER.password + ')');

  // جهات تجريبية لكل نوع + مدير لكل جهة
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const o of DEMO_ORGS) {
    const org = await prisma.organization.upsert({
      where: { slug: o.slug },
      update: { brandColor: o.brandColor },
      create: { name: o.name, slug: o.slug, type: o.type, brandColor: o.brandColor },
    });
    await prisma.user.upsert({
      where: { email: o.adminEmail },
      update: {},
      create: {
        name: o.adminName,
        email: o.adminEmail,
        passwordHash: demoHash,
        role: Role.ORG_ADMIN,
        organizationId: org.id,
      },
    });
    console.log(`✓ ${o.name} — ${o.adminEmail}  →  ${o.slug}.midad.localhost:3000  (كلمة المرور: ${DEMO_PASSWORD})`);
  }

  console.log('\nتمّت التهيئة. جميع الحسابات التجريبية بكلمة المرور: ' + DEMO_PASSWORD);
}

main()
  .catch((error) => {
    console.error('فشل إنشاء الحساب:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

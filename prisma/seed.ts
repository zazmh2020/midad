import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/* ============================================================
   بيانات مالك المنصة — عدّلها قبل التشغيل
   ============================================================ */

const OWNER_NAME = 'مالك المنصة';
const OWNER_EMAIL = 'owner@midad.local';
const OWNER_PASSWORD = 'ChangeMe123!';

async function main() {
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);

  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL.toLowerCase() },
    update: {},
    create: {
      name: OWNER_NAME,
      email: OWNER_EMAIL.toLowerCase(),
      passwordHash,
      role: Role.PLATFORM_OWNER,
    },
  });

  console.log('تم إنشاء حساب مالك المنصة:');
  console.log('  البريد: ' + owner.email);
  console.log('  الدور : ' + owner.role);
}

main()
  .catch((error) => {
    console.error('فشل إنشاء الحساب:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const OWNER_NAME = "zakaria";
const OWNER_EMAIL = "zazmh24@gmail.com";
const OWNER_PASSWORD = "Zahariri@2026";

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

  console.log("Owner created: " + owner.email + " / " + owner.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
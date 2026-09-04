-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "plan" "OrgPlan" NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "planRenewsAt" TIMESTAMP(3);

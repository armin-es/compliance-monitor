-- DropIndex
DROP INDEX "Analysis_userId_idx";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "orgId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Analysis_orgId_idx" ON "Analysis"("orgId");

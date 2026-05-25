-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "guideline" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

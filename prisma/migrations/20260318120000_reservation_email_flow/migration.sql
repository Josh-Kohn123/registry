-- AlterTable: Add email-flow fields to reservations
ALTER TABLE "reservations" ADD COLUMN "guestPhone" TEXT;
ALTER TABLE "reservations" ADD COLUMN "guestMessage" TEXT;
ALTER TABLE "reservations" ADD COLUMN "cancelToken" TEXT;
ALTER TABLE "reservations" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateIndex: unique constraint on cancelToken
CREATE UNIQUE INDEX "reservations_cancelToken_key" ON "reservations"("cancelToken");

-- CreateIndex: composite index for cron reminder queries
CREATE INDEX "reservations_status_reminderSentAt_idx" ON "reservations"("status", "reminderSentAt");

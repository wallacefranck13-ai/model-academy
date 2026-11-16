-- MODEL ACADEMY v1.3 — apply after backing up the database.
-- Aligns Prisma schema with explicit proposal-response workflow.
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Contract" ALTER COLUMN "status" SET DEFAULT 'PROPOSED';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PROPOSED';
DO $$ BEGIN
  ALTER TABLE "Contract" ADD CONSTRAINT "Contract_modelId_fkey"
    FOREIGN KEY ("modelId") REFERENCES "ModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Contract_modelId_status_idx" ON "Contract"("modelId", "status");
CREATE INDEX IF NOT EXISTS "Booking_modelId_startAt_idx" ON "Booking"("modelId", "startAt");

-- MODEL ACADEMY v0.9 — studios professionnels et programmes de sponsoring
-- À appliquer après le schéma v0.8. Sauvegarder la base avant migration.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SPONSOR';
CREATE TYPE "SponsorOpportunityStatus" AS ENUM ('DRAFT','PENDING_REVIEW','PUBLISHED','CLOSED','CANCELLED');
CREATE TYPE "SponsorApplicationStatus" AS ENUM ('SUBMITTED','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED','WITHDRAWN');
CREATE TABLE "SponsorOpportunity" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "supportType" TEXT NOT NULL,
  "amount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'XOF',
  "country" TEXT NOT NULL DEFAULT 'TG',
  "deadline" TIMESTAMP(3),
  "status" "SponsorOpportunityStatus" NOT NULL DEFAULT 'DRAFT',
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SponsorOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SponsorOpportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SponsorOpportunity_status_isVerified_deadline_idx" ON "SponsorOpportunity"("status","isVerified","deadline");
CREATE INDEX "SponsorOpportunity_ownerId_createdAt_idx" ON "SponsorOpportunity"("ownerId","createdAt");
CREATE TABLE "SponsorApplication" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "message" TEXT,
  "status" "SponsorApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SponsorApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SponsorApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "SponsorOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SponsorApplication_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SponsorApplication_opportunityId_modelId_key" ON "SponsorApplication"("opportunityId","modelId");
CREATE INDEX "SponsorApplication_modelId_createdAt_idx" ON "SponsorApplication"("modelId","createdAt");

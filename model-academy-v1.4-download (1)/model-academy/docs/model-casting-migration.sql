-- MODEL ACADEMY v0.8 — appliquer après sauvegarde de la base existante.
-- Équivalent SQL de l'évolution du modèle Prisma Casting.
ALTER TABLE "Casting"
  ADD COLUMN IF NOT EXISTS "requirements" TEXT,
  ADD COLUMN IF NOT EXISTS "compensationType" TEXT,
  ADD COLUMN IF NOT EXISTS "usageRights" TEXT,
  ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "Casting_status_isVerified_deadline_idx"
  ON "Casting" ("status", "isVerified", "deadline");
CREATE INDEX IF NOT EXISTS "Casting_ownerId_createdAt_idx"
  ON "Casting" ("ownerId", "createdAt");

-- Modération manuelle réservée à un administrateur authentifié via l'outil admin.
-- Ne pas exécuter automatiquement depuis l'application publique.
-- UPDATE "Casting" SET "status" = 'PUBLISHED', "isVerified" = TRUE WHERE "id" = '<ID_VALIDÉ>';
-- Pour refuser : UPDATE "Casting" SET "status" = 'CANCELLED' WHERE "id" = '<ID_REFUSÉ>';

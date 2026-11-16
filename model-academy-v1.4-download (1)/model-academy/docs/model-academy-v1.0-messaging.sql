-- MODEL ACADEMY v1.0 — messagerie sécurisée entre membres
-- À appliquer après les migrations v0.9.
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT PRIMARY KEY,
  "userAId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "userBId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "castingApplicationId" TEXT UNIQUE REFERENCES "CastingApplication"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversation_distinct_members" CHECK ("userAId" <> "userBId")
);
CREATE INDEX IF NOT EXISTS "Conversation_userAId_updatedAt_idx" ON "Conversation"("userAId","updatedAt");
CREATE INDEX IF NOT EXISTS "Conversation_userBId_updatedAt_idx" ON "Conversation"("userBId","updatedAt");
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "body" VARCHAR(2000) NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId","createdAt");
CREATE INDEX IF NOT EXISTS "Message_senderId_createdAt_idx" ON "Message"("senderId","createdAt");

-- CreateTable
CREATE TABLE "dead_drops" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "hasPassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "expiryHours" INTEGER NOT NULL DEFAULT 48,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dead_drops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dead_drops_token_key" ON "dead_drops"("token");

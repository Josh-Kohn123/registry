-- CreateTable
CREATE TABLE "extension_tokens" (
    "id" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "extension_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extension_tokens_tokenHash_key" ON "extension_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "extension_tokens_profileId_idx" ON "extension_tokens"("profileId");

-- AddForeignKey
ALTER TABLE "extension_tokens" ADD CONSTRAINT "extension_tokens_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

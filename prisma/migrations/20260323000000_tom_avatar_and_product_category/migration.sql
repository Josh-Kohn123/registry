-- AlterTable: Add avatarUrl to profiles
ALTER TABLE "profiles" ADD COLUMN "avatarUrl" TEXT;

-- AlterTable: Add category to product_links
ALTER TABLE "product_links" ADD COLUMN "category" TEXT;

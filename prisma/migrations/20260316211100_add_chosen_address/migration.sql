-- Add chosenAddressId column to reservations
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "chosenAddressId" TEXT;

-- AlterTable: Remove unique constraint from BarberProfile.userId and add composite unique constraint
-- This allows a user to have multiple barber profiles (one per barbershop)

-- First, drop the existing unique constraint on userId
ALTER TABLE "BarberProfile" DROP CONSTRAINT IF EXISTS "BarberProfile_userId_key";

-- Add composite unique constraint on userId and barbershopId
ALTER TABLE "BarberProfile" ADD CONSTRAINT "BarberProfile_userId_barbershopId_key" UNIQUE ("userId", "barbershopId");

-- Update User model relation (this is handled by Prisma schema, but we need to ensure the database is consistent)
-- The relation change from one-to-one to one-to-many is handled by Prisma automatically


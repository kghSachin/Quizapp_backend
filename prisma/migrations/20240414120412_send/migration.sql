-- AlterTable
ALTER TABLE "User" ADD COLUMN     "codeExpiryDate" TIMESTAMP(3),
ADD COLUMN     "verifyCode" TEXT;

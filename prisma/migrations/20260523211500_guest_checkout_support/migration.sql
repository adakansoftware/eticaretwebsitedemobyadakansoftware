-- AlterTable
ALTER TABLE "Order"
ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT;

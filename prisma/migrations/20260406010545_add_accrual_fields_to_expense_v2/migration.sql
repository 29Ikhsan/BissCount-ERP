/*
  Warnings:

  - A unique constraint covering the columns `[referenceCode]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "referenceCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Expense_referenceCode_key" ON "Expense"("referenceCode");

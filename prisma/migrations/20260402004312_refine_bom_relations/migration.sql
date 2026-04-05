-- AddForeignKey
ALTER TABLE "BOMItem" ADD CONSTRAINT "BOMItem_finishedProductId_fkey" FOREIGN KEY ("finishedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

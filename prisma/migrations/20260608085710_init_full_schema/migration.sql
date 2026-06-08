/*
  Warnings:

  - A unique constraint covering the columns `[productId,locationId,lotId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Inventory_productId_locationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_locationId_lotId_key" ON "Inventory"("productId", "locationId", "lotId");

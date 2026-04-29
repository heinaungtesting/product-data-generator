-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "pointValue" INTEGER NOT NULL,
    "barcode" TEXT,
    "image" TEXT,
    "recommendedProductId" TEXT,
    "contentUpdatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_recommendedProductId_fkey" FOREIGN KEY ("recommendedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("barcode", "category", "contentUpdatedAt", "createdAt", "id", "image", "pointValue", "recommendedProductId", "updatedAt") SELECT "barcode", "category", "contentUpdatedAt", "createdAt", "id", "image", "pointValue", "recommendedProductId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

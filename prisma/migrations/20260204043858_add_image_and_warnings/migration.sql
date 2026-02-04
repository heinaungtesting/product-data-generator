-- AlterTable
ALTER TABLE "Product" ADD COLUMN "image" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductText" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effects" TEXT NOT NULL,
    "sideEffects" TEXT NOT NULL,
    "goodFor" TEXT NOT NULL,
    "warnings" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ProductText_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductText" ("description", "effects", "goodFor", "id", "language", "name", "productId", "sideEffects") SELECT "description", "effects", "goodFor", "id", "language", "name", "productId", "sideEffects" FROM "ProductText";
DROP TABLE "ProductText";
ALTER TABLE "new_ProductText" RENAME TO "ProductText";
CREATE UNIQUE INDEX "ProductText_productId_language_key" ON "ProductText"("productId", "language");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

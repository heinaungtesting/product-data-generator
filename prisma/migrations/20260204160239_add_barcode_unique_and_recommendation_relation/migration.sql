-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- AlterTable (Add foreign key for recommendedProductId self-relation)
-- Note: This is a self-referencing foreign key
-- SQLite doesn't support adding foreign keys after table creation,
-- so this migration documents the schema change.
-- The relation is enforced at the application level via Prisma.

-- ============================================================================
-- SUPABASE MIGRATION: Add product fields
-- ============================================================================
-- Adds point_value to products table and additional text fields to product_texts
-- ============================================================================

-- Add point_value to products table
ALTER TABLE products
ADD COLUMN point_value INTEGER;

-- Add effects, side_effects, and good_for to product_texts table
ALTER TABLE product_texts
ADD COLUMN effects TEXT,
ADD COLUMN side_effects TEXT,
ADD COLUMN good_for TEXT;

-- Add index on point_value for filtering/sorting
CREATE INDEX idx_products_point_value ON products(point_value) WHERE point_value IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.point_value IS 'Point/reward value for the product';
COMMENT ON COLUMN product_texts.effects IS 'Product effects and benefits';
COMMENT ON COLUMN product_texts.side_effects IS 'Known side effects or adverse reactions';
COMMENT ON COLUMN product_texts.good_for IS 'Target audience or who this product is good for';

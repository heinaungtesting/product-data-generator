-- ============================================================================
-- SUPABASE MIGRATION: Initial Schema for Product Data Generator
-- ============================================================================
-- This migration creates the complete database schema for the product data
-- generator, including products, texts, tags, and bundle metadata.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Products table (main product data)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  jan_code TEXT,
  barcode TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_updated_at ON products(updated_at DESC);
CREATE INDEX idx_products_jan_code ON products(jan_code) WHERE jan_code IS NOT NULL;

-- Product texts (multilingual support)
CREATE TABLE product_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lang TEXT NOT NULL DEFAULT 'en',
  name TEXT NOT NULL,
  description TEXT,
  features JSONB,
  usage TEXT,
  ingredients TEXT,
  warnings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(product_id, lang)
);

CREATE INDEX idx_product_texts_product_id ON product_texts(product_id);
CREATE INDEX idx_product_texts_lang ON product_texts(lang);

-- Tags table
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product tags junction table
CREATE TABLE product_tags (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag_id ON product_tags(tag_id);

-- Bundle metadata (tracks generated bundles)
CREATE TABLE bundle_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etag TEXT NOT NULL UNIQUE,
  product_count INTEGER NOT NULL,
  built_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  storage_path TEXT NOT NULL,
  size_bytes INTEGER,
  schema_version TEXT NOT NULL DEFAULT '1.0.0'
);

CREATE INDEX idx_bundle_metadata_built_at ON bundle_metadata(built_at DESC);
CREATE INDEX idx_bundle_metadata_etag ON bundle_metadata(etag);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_metadata ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for public PWA)
CREATE POLICY "Allow anonymous read on products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on product_texts"
  ON product_texts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on tags"
  ON tags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on product_tags"
  ON product_tags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on bundle_metadata"
  ON bundle_metadata FOR SELECT
  TO anon
  USING (true);

-- Allow service role full access (for MCP server and Edge Functions)
CREATE POLICY "Allow service role all on products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all on product_texts"
  ON product_texts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all on tags"
  ON tags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all on product_tags"
  ON product_tags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all on bundle_metadata"
  ON bundle_metadata FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Automatically update updated_at on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically update updated_at on product_texts
CREATE TRIGGER update_product_texts_updated_at
  BEFORE UPDATE ON product_texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to regenerate bundle when products change
CREATE OR REPLACE FUNCTION trigger_bundle_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoke Edge Function asynchronously using pg_net extension
  -- Note: This requires pg_net extension to be enabled
  PERFORM
    net.http_post(
      url := current_setting('app.settings.edge_function_url', true),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'trigger', 'database_change',
        'table', TG_TABLE_NAME,
        'operation', TG_OP
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to auto-regenerate bundle on data changes
CREATE TRIGGER trigger_bundle_on_product_insert
  AFTER INSERT ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

CREATE TRIGGER trigger_bundle_on_product_update
  AFTER UPDATE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

CREATE TRIGGER trigger_bundle_on_product_delete
  AFTER DELETE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

CREATE TRIGGER trigger_bundle_on_product_texts_change
  AFTER INSERT OR UPDATE OR DELETE ON product_texts
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

CREATE TRIGGER trigger_bundle_on_product_tags_change
  AFTER INSERT OR UPDATE OR DELETE ON product_tags
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default tags (optional, can be populated later)
INSERT INTO tags (id) VALUES
  ('organic'),
  ('vegan'),
  ('gluten-free'),
  ('health'),
  ('beauty')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE products IS 'Main product catalog with core product data';
COMMENT ON TABLE product_texts IS 'Multilingual product text content (name, description, etc.)';
COMMENT ON TABLE tags IS 'Product tags for categorization and filtering';
COMMENT ON TABLE product_tags IS 'Junction table linking products to tags';
COMMENT ON TABLE bundle_metadata IS 'Metadata about generated bundle files';

COMMENT ON COLUMN products.jan_code IS 'Japanese Article Number (JAN) barcode';
COMMENT ON COLUMN products.synced_at IS 'Timestamp when product was last synced to bundle';
COMMENT ON COLUMN product_texts.features IS 'JSON array of product features';
COMMENT ON COLUMN bundle_metadata.etag IS 'ETag hash for bundle versioning and caching';
COMMENT ON COLUMN bundle_metadata.storage_path IS 'Path to bundle file in Supabase Storage';

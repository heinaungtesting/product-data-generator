-- ============================================================================
-- Phase 1: Staff Point Management System
-- Created: 2025-01-15
-- Description: Adds staff table, point_logs table, and related triggers
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STAFF TABLE
-- ============================================================================
-- Stores staff member information and their current point balance
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  point_balance INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for staff table
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staff_created_at ON staff(created_at DESC);

-- Comments
COMMENT ON TABLE staff IS 'Staff members who earn points from product sales';
COMMENT ON COLUMN staff.point_balance IS 'Current total points (auto-calculated from point_logs)';
COMMENT ON COLUMN staff.is_active IS 'Whether staff member is currently active';

-- ============================================================================
-- POINT LOGS TABLE
-- ============================================================================
-- Records every point transaction (sales logged by owner)
CREATE TABLE IF NOT EXISTS point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('health', 'cosmetic')),
  notes TEXT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for point_logs table
CREATE INDEX IF NOT EXISTS idx_point_logs_staff_id ON point_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_product_id ON point_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_log_date ON point_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_point_logs_created_at ON point_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_logs_staff_date ON point_logs(staff_id, log_date DESC);

-- Comments
COMMENT ON TABLE point_logs IS 'Transaction log of all point earnings by staff';
COMMENT ON COLUMN point_logs.product_id IS 'Reference to product (NULL if product deleted)';
COMMENT ON COLUMN point_logs.product_name IS 'Snapshot of product name for history';
COMMENT ON COLUMN point_logs.points IS 'Points earned (can be negative for corrections)';
COMMENT ON COLUMN point_logs.log_date IS 'Date of the sale (defaults to today)';

-- ============================================================================
-- TRIGGERS: Auto-update staff point balance
-- ============================================================================

-- Function to update staff balance when point logs change
CREATE OR REPLACE FUNCTION update_staff_point_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    UPDATE staff
    SET
      point_balance = point_balance + NEW.points,
      updated_at = NOW()
    WHERE id = NEW.staff_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    UPDATE staff
    SET
      point_balance = point_balance - OLD.points,
      updated_at = NOW()
    WHERE id = OLD.staff_id;
    RETURN OLD;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- If staff_id changed (rare), update both old and new staff
    IF (OLD.staff_id != NEW.staff_id) THEN
      -- Remove points from old staff
      UPDATE staff
      SET
        point_balance = point_balance - OLD.points,
        updated_at = NOW()
      WHERE id = OLD.staff_id;

      -- Add points to new staff
      UPDATE staff
      SET
        point_balance = point_balance + NEW.points,
        updated_at = NOW()
      WHERE id = NEW.staff_id;
    ELSE
      -- Same staff, just update the difference
      UPDATE staff
      SET
        point_balance = point_balance - OLD.points + NEW.points,
        updated_at = NOW()
      WHERE id = NEW.staff_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to point_logs table
DROP TRIGGER IF EXISTS point_logs_update_balance ON point_logs;
CREATE TRIGGER point_logs_update_balance
  AFTER INSERT OR UPDATE OR DELETE ON point_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_point_balance();

COMMENT ON FUNCTION update_staff_point_balance() IS 'Auto-updates staff point_balance when point_logs change';

-- ============================================================================
-- TRIGGER: Auto-update staff.updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Enable RLS on point_logs table
ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "service_role_all_staff" ON staff
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_point_logs" ON point_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all staff (for dropdowns)
CREATE POLICY "authenticated_read_staff" ON staff
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to read point logs
CREATE POLICY "authenticated_read_point_logs" ON point_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Staff can only see their own point logs
CREATE POLICY "staff_read_own_logs" ON point_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = staff_id::text);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to recalculate staff balance (for maintenance/corrections)
CREATE OR REPLACE FUNCTION recalculate_staff_balance(staff_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  correct_balance INTEGER;
BEGIN
  -- Calculate correct balance from all logs
  SELECT COALESCE(SUM(points), 0)
  INTO correct_balance
  FROM point_logs
  WHERE staff_id = staff_uuid;

  -- Update staff record
  UPDATE staff
  SET
    point_balance = correct_balance,
    updated_at = NOW()
  WHERE id = staff_uuid;

  RETURN correct_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_staff_balance(UUID) IS 'Recalculates staff point balance from logs (for drift correction)';

-- Function to get staff points by date range
CREATE OR REPLACE FUNCTION get_staff_points_by_date(
  staff_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  log_date DATE,
  total_points INTEGER,
  log_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    point_logs.log_date,
    SUM(point_logs.points)::INTEGER as total_points,
    COUNT(*)::INTEGER as log_count
  FROM point_logs
  WHERE
    staff_id = staff_uuid
    AND log_date >= start_date
    AND log_date <= end_date
  GROUP BY point_logs.log_date
  ORDER BY point_logs.log_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_staff_points_by_date(UUID, DATE, DATE) IS 'Get daily point totals for staff within date range';

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Insert sample staff (commented out - uncomment for testing)
-- INSERT INTO staff (email, name, point_balance) VALUES
--   ('john@store.com', 'John Smith', 0),
--   ('mary@store.com', 'Mary Johnson', 0),
--   ('bob@store.com', 'Bob Williams', 0)
-- ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staff') = 1,
    'staff table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'point_logs') = 1,
    'point_logs table not created';

  RAISE NOTICE 'Staff point management system migration completed successfully!';
  RAISE NOTICE 'Tables created: staff, point_logs';
  RAISE NOTICE 'Triggers created: point_logs_update_balance, staff_updated_at';
  RAISE NOTICE 'Helper functions: recalculate_staff_balance, get_staff_points_by_date';
END $$;

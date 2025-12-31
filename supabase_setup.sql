-- ================================================
-- TERMSPLAIN EXIT BOARD - SUPABASE SCHEMA
-- ================================================

-- Create exit_listings table
CREATE TABLE IF NOT EXISTS public.exit_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city text NOT NULL,
  state text NOT NULL,
  neighborhood text,
  rent integer NOT NULL CHECK (rent > 0),
  deposit integer CHECK (deposit >= 0),
  lease_end_date date NOT NULL,
  earliest_move_in_date date NOT NULL,
  beds_baths text NOT NULL,
  housing_type text NOT NULL CHECK (housing_type IN ('apartment', 'house', 'townhouse', 'other')),
  description text NOT NULL,
  reason text,
  contact text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exit_listings_city ON public.exit_listings(city);
CREATE INDEX IF NOT EXISTS idx_exit_listings_rent ON public.exit_listings(rent);
CREATE INDEX IF NOT EXISTS idx_exit_listings_lease_end ON public.exit_listings(lease_end_date);
CREATE INDEX IF NOT EXISTS idx_exit_listings_move_in ON public.exit_listings(earliest_move_in_date);
CREATE INDEX IF NOT EXISTS idx_exit_listings_status ON public.exit_listings(status);
CREATE INDEX IF NOT EXISTS idx_exit_listings_user_id ON public.exit_listings(user_id);

-- Enable Row Level Security
ALTER TABLE public.exit_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to read active listings" ON public.exit_listings;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own listings" ON public.exit_listings;
DROP POLICY IF EXISTS "Allow users to update their own listings" ON public.exit_listings;
DROP POLICY IF EXISTS "Allow users to delete their own listings" ON public.exit_listings;

-- Policy 1: SELECT - Allow everyone to read active listings
CREATE POLICY "Allow anonymous and authenticated users to read active listings"
  ON public.exit_listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Policy 2: INSERT - Allow authenticated users to insert with their own user_id
CREATE POLICY "Allow authenticated users to insert their own listings"
  ON public.exit_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE - Allow users to update only their own listings
CREATE POLICY "Allow users to update their own listings"
  ON public.exit_listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Allow users to delete only their own listings
CREATE POLICY "Allow users to delete their own listings"
  ON public.exit_listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.exit_listings TO anon, authenticated;
GRANT INSERT ON public.exit_listings TO authenticated;
GRANT UPDATE ON public.exit_listings TO authenticated;
GRANT DELETE ON public.exit_listings TO authenticated;

-- Verify table exists
SELECT 'exit_listings table created successfully' AS status;

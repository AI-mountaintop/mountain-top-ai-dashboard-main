-- ============================================
-- Supabase Database Setup Script
-- ============================================
-- Run this script in your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- ============================================

-- ============================================
-- 1. Create digital_trailmaps table
-- ============================================
CREATE TABLE IF NOT EXISTS digital_trailmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_name TEXT NOT NULL,
  meeting_link TEXT,
  trailmap_link TEXT,
  report_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create meeting_action_items table
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_name TEXT NOT NULL,
  meetgeek_url TEXT,
  google_drive_link TEXT,
  html_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE digital_trailmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies for digital_trailmaps
-- ============================================

-- Policy: Allow anyone to read trailmaps (public read access)
CREATE POLICY "Allow public read access to digital_trailmaps"
  ON digital_trailmaps
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert trailmaps (public insert access)
CREATE POLICY "Allow public insert access to digital_trailmaps"
  ON digital_trailmaps
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update trailmaps (public update access)
CREATE POLICY "Allow public update access to digital_trailmaps"
  ON digital_trailmaps
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to delete trailmaps (public delete access)
CREATE POLICY "Allow public delete access to digital_trailmaps"
  ON digital_trailmaps
  FOR DELETE
  USING (true);

-- ============================================
-- 5. Create RLS Policies for meeting_action_items
-- ============================================

-- Policy: Allow anyone to read action items (public read access)
CREATE POLICY "Allow public read access to meeting_action_items"
  ON meeting_action_items
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert action items (public insert access)
CREATE POLICY "Allow public insert access to meeting_action_items"
  ON meeting_action_items
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update action items (public update access)
CREATE POLICY "Allow public update access to meeting_action_items"
  ON meeting_action_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to delete action items (public delete access)
CREATE POLICY "Allow public delete access to meeting_action_items"
  ON meeting_action_items
  FOR DELETE
  USING (true);

-- ============================================
-- 6. Create indexes for better query performance
-- ============================================

-- Index on created_at for sorting/filtering by date
CREATE INDEX IF NOT EXISTS idx_digital_trailmaps_created_at 
  ON digital_trailmaps(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_action_items_created_at 
  ON meeting_action_items(created_at DESC);

-- Index on meeting_name for searching
CREATE INDEX IF NOT EXISTS idx_digital_trailmaps_meeting_name 
  ON digital_trailmaps(meeting_name);

CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_name 
  ON meeting_action_items(meeting_name);

-- ============================================
-- 7. Create updated_at trigger function (optional)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to both tables
CREATE TRIGGER update_digital_trailmaps_updated_at
  BEFORE UPDATE ON digital_trailmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_action_items_updated_at
  BEFORE UPDATE ON meeting_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Setup Complete!
-- ============================================
-- Your tables are now ready to use.
-- 
-- Tables created:
-- ✅ digital_trailmaps
-- ✅ meeting_action_items
--
-- Features enabled:
-- ✅ Row Level Security (RLS)
-- ✅ Public read/write access policies
-- ✅ Indexes for performance
-- ✅ Auto-updating timestamps
-- ============================================


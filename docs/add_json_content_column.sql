-- Add json_content column to meeting_action_items table
-- Run this in your Supabase SQL Editor

ALTER TABLE meeting_action_items 
ADD COLUMN IF NOT EXISTS json_content JSONB;

-- Optional: Add an index for better query performance on JSON data
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_json_content 
ON meeting_action_items USING GIN (json_content);

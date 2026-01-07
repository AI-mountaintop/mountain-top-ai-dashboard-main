# Supabase Setup Guide

This guide will help you set up all the required tables and columns in your Supabase database.

## Quick Setup Steps

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `azoduzkaoacyjytucyzw`
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

### Step 2: Run the Setup Script

1. Copy the entire contents of `supabase-setup.sql` file
2. Paste it into the SQL Editor
3. Click **"Run"** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

### Step 3: Verify Tables Were Created

1. Go to **"Table Editor"** in the left sidebar
2. You should see two tables:
   - ✅ `digital_trailmaps`
   - ✅ `meeting_action_items`

## Tables Overview

### 1. `digital_trailmaps` Table

Stores information about generated digital trailmaps.

**Columns:**
- `id` (UUID) - Primary key, auto-generated
- `meeting_name` (TEXT) - Name of the meeting
- `meeting_link` (TEXT) - Link to the original meeting (optional)
- `trailmap_link` (TEXT) - Link to the Google Slides trailmap (optional)
- `report_link` (TEXT) - Link to the Google Doc report (optional)
- `created_at` (TIMESTAMP) - When the record was created (auto-generated)
- `updated_at` (TIMESTAMP) - When the record was last updated (auto-generated)

### 2. `meeting_action_items` Table

Stores information about generated meeting action items.

**Columns:**
- `id` (UUID) - Primary key, auto-generated
- `meeting_name` (TEXT) - Name of the meeting
- `meetgeek_url` (TEXT) - URL to the MeetGeek meeting (optional)
- `google_drive_link` (TEXT) - Link to the Google Doc with action items (optional)
- `html_content` (TEXT) - HTML content of the action items email (optional)
- `created_at` (TIMESTAMP) - When the record was created (auto-generated)
- `updated_at` (TIMESTAMP) - When the record was last updated (auto-generated)

## Security (RLS Policies)

The setup script creates Row Level Security (RLS) policies that allow:
- ✅ **Public read access** - Anyone can read records
- ✅ **Public insert access** - Your backend can insert records
- ✅ **Public update access** - Your backend can update records
- ✅ **Public delete access** - Your backend can delete records

**Note:** These are permissive policies suitable for backend-to-database communication. If you need more restrictive access, you can modify the policies in the Supabase Dashboard under **Authentication > Policies**.

## Performance Indexes

The script creates indexes on:
- `created_at` - For sorting records by date
- `meeting_name` - For searching by meeting name

These indexes improve query performance when filtering or sorting data.

## Testing the Setup

After running the setup script, you can test the connection:

```bash
# From your project directory
node server/test-supabase-connection.js
```

This will:
1. ✅ Verify credentials are loaded
2. ✅ Test table access
3. ✅ Test insert operation
4. ✅ Clean up test data

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the entire SQL script
- Check that you're in the correct Supabase project

### Error: "permission denied"
- Check that RLS policies were created correctly
- Verify your Supabase anon key is correct in `.env`

### Error: "duplicate key value violates unique constraint"
- This means the table already exists
- You can either drop the existing table or use `CREATE TABLE IF NOT EXISTS` (already included in the script)

### Tables not showing in Table Editor
- Refresh the page
- Check that you're in the correct project
- Verify the SQL script ran without errors

## Manual Table Creation (Alternative)

If you prefer to create tables manually through the UI:

### Create `digital_trailmaps` table:

1. Go to **Table Editor** > **New Table**
2. Name: `digital_trailmaps`
3. Add columns:
   - `id` - Type: `uuid`, Primary key, Default: `gen_random_uuid()`
   - `meeting_name` - Type: `text`, Not null
   - `meeting_link` - Type: `text`, Nullable
   - `trailmap_link` - Type: `text`, Nullable
   - `report_link` - Type: `text`, Nullable
   - `created_at` - Type: `timestamptz`, Default: `now()`
   - `updated_at` - Type: `timestamptz`, Default: `now()`

### Create `meeting_action_items` table:

1. Go to **Table Editor** > **New Table**
2. Name: `meeting_action_items`
3. Add columns:
   - `id` - Type: `uuid`, Primary key, Default: `gen_random_uuid()`
   - `meeting_name` - Type: `text`, Not null
   - `meetgeek_url` - Type: `text`, Nullable
   - `google_drive_link` - Type: `text`, Nullable
   - `html_content` - Type: `text`, Nullable
   - `created_at` - Type: `timestamptz`, Default: `now()`
   - `updated_at` - Type: `timestamptz`, Default: `now()`

### Enable RLS and Create Policies:

1. Go to **Authentication** > **Policies**
2. For each table, enable RLS
3. Create policies for SELECT, INSERT, UPDATE, DELETE with `true` as the condition

## Next Steps

After setting up the tables:

1. ✅ Verify your `.env` file has the correct Supabase credentials
2. ✅ Restart your backend server
3. ✅ Test by generating a trailmap
4. ✅ Check Supabase Table Editor to see the new record

Your Supabase database is now ready to store trailmap and action items data! 🎉


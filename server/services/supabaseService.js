import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file if not already loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Supabase operations will fail.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Save trailmap data to Supabase
 */
export async function saveToSupabase({ meetingName, meetingLink, trailmapLink, reportLink }) {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping database save.');
    return { id: null };
  }

  try {
    const { data, error } = await supabase
      .from('digital_trailmaps')
      .insert({
        meeting_name: meetingName,
        meeting_link: meetingLink,
        trailmap_link: trailmapLink,
        report_link: reportLink
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Successfully saved to Supabase:', data.id);
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    console.error('This will prevent the trailmap from appearing in the history list.');
    // Don't throw - allow the process to continue even if Supabase fails
    return { id: null };
  }
}

/**
 * Save action items data to Supabase
 */
export async function saveActionItemsToSupabase({ meetingName, meetgeekUrl, googleDriveLink, htmlContent }) {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping database save.');
    return { id: null };
  }

  try {
    const { data, error } = await supabase
      .from('meeting_action_items')
      .insert({
        meeting_name: meetingName,
        meetgeek_url: meetgeekUrl,
        google_drive_link: googleDriveLink,
        html_content: htmlContent
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving action items to Supabase:', error);
    // Don't throw - allow the process to continue even if Supabase fails
    return { id: null };
  }
}

/**
 * Delete trailmap from Supabase
 */
export async function deleteTrailmapFromSupabase(trailmapId) {
  if (!supabase) {
    console.warn('Supabase not configured. Cannot delete from database.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('digital_trailmaps')
      .delete()
      .eq('id', trailmapId);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    console.log('✅ Successfully deleted trailmap from Supabase:', trailmapId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting trailmap from Supabase:', error);
    throw error;
  }
}

/**
 * Delete action item from Supabase
 */
export async function deleteActionItemFromSupabase(actionItemId) {
  if (!supabase) {
    console.warn('Supabase not configured. Cannot delete from database.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('meeting_action_items')
      .delete()
      .eq('id', actionItemId);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    console.log('✅ Successfully deleted action item from Supabase:', actionItemId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting action item from Supabase:', error);
    throw error;
  }
}


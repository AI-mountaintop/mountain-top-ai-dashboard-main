import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixDocumentUrls() {
  console.log('Fixing document URLs in database...\n');

  try {
    // Get all action items
    const { data: items, error } = await supabase
      .from('meeting_action_items')
      .select('id, google_drive_link')
      .not('google_drive_link', 'is', null);

    if (error) throw error;

    console.log(`Found ${items.length} action items with Google Drive links\n`);

    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const link = item.google_drive_link;
      
      // Check if URL needs fixing (doesn't have /edit)
      if (link && link.includes('docs.google.com/document/d/') && !link.includes('/edit')) {
        // Add /edit to the URL
        const newLink = link.endsWith('/') ? `${link}edit` : `${link}/edit`;
        
        const { error: updateError } = await supabase
          .from('meeting_action_items')
          .update({ 
            google_drive_link: newLink
          })
          .eq('id', item.id)
          .select();

        if (updateError) {
          console.error(`Error updating ${item.id}:`, updateError.message);
        } else {
          console.log(`✓ Updated: ${item.id}`);
          console.log(`  Old: ${link}`);
          console.log(`  New: ${newLink}\n`);
          updated++;
        }
      } else {
        skipped++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total items: ${items.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (already correct): ${skipped}`);
    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixDocumentUrls();

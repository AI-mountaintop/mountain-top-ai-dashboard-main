import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testSupabase() {
  console.log('🔍 Testing Supabase Connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in .env');
    console.error('   Please add:');
    console.error('   SUPABASE_URL=...');
    console.error('   SUPABASE_ANON_KEY=...');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Check if we can query the table
  console.log('📊 Testing table access...');
  try {
    const { data, error } = await supabase
      .from('digital_trailmaps')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error querying table:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('\n💡 The table "digital_trailmaps" does not exist.');
        console.error('   Please create it in your Supabase dashboard.');
      } else if (error.code === '42501' || error.message.includes('permission')) {
        console.error('\n💡 Permission denied. Check your RLS (Row Level Security) policies.');
      }
      process.exit(1);
    }

    console.log(`✅ Table accessible! Found ${data?.length || 0} records\n`);

    // Test 2: Try inserting a test record
    console.log('📝 Testing insert operation...');
    const testData = {
      meeting_name: 'Test Trailmap',
      meeting_link: 'https://test.example.com',
      trailmap_link: null,
      report_link: null
    };

    const { data: insertData, error: insertError } = await supabase
      .from('digital_trailmaps')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError.message);
      console.error('   Code:', insertError.code);
      console.error('   Details:', insertError.details);
      
      if (insertError.code === '42501' || insertError.message.includes('permission')) {
        console.error('\n💡 Insert permission denied. Check your RLS policies.');
        console.error('   You may need to enable INSERT for authenticated/anonymous users.');
      }
      process.exit(1);
    }

    console.log('✅ Insert successful! Test record ID:', insertData.id);

    // Clean up: Delete test record
    console.log('\n🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('digital_trailmaps')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️  Could not delete test record:', deleteError.message);
      console.warn(`   Please delete it manually: ID ${insertData.id}`);
    } else {
      console.log('✅ Test record deleted');
    }

    console.log('\n✅ All Supabase tests passed!');
    console.log('   Your Supabase connection is working correctly.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

testSupabase()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });


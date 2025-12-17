import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azoduzkaoacyjytucyzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6b2R1emthb2FjeWp5dHVjeXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTIzNzMsImV4cCI6MjA4MTUyODM3M30.dotOfEnkWutzAA-Soo-rEJXa_i0E7NSaTGNFqW58EGY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

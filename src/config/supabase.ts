/**
 * Supabase Configuration
 * 
 * This file exports the Supabase configuration.
 * Make sure to set these environment variables in your .env file:
 * 
 * VITE_SUPABASE_URL=https://your-project.supabase.co
 * VITE_SUPABASE_ANON_KEY=your-anon-key
 * VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/translation
 */

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://spijkerenco.app.n8n.cloud/webhook/extract-sitemap',
};

// Validate configuration
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.warn(
    'Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}


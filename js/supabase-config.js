// js/supabase-config.js
// Supabase project credentials (anon/publishable key is safe to expose)
const SUPABASE_URL = 'https://mmswssnhtyzvenocynlf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-cBUnEx84N80opkibl9lJw_U12pyMDX';

// Initialize Supabase client (requires Supabase CDN loaded before this file)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

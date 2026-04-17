// js/supabase-config.js
// Supabase project credentials (anon/publishable key is safe to expose)
const SUPABASE_URL = 'https://mmswssnhtyzvenocynlf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tc3dzc25odHl6dmVub2N5bmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNTY0MjgsImV4cCI6MjA1ODkzMjQyOH0.placeholder_key_replace_if_needed';

// Initialize Supabase client safely — if the Supabase CDN or project is unavailable,
// the app will continue working using local data and localStorage.
try {
    if (typeof window.supabase !== 'undefined') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        console.log('[MelodyStream] Supabase client initialized.');
    } else {
        console.warn('[MelodyStream] Supabase CDN not loaded — running in offline mode.');
        window.supabaseClient = undefined;
    }
} catch (e) {
    console.warn('[MelodyStream] Supabase init failed — running in offline mode.', e.message);
    window.supabaseClient = undefined;
}

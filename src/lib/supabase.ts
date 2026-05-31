import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** True when both env vars are present. Used to show a friendly setup screen. */
export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  // Surface a clear console message during local dev / preview.
  // The app renders a setup notice instead of crashing.
  console.warn(
    '[miller-pb] Supabase is not configured. Add VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY to your .env file.',
  );
}

// Fall back to harmless placeholder values so createClient does not throw at
// import time; isSupabaseConfigured gates all real usage.
export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  },
);

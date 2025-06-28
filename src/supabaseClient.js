import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

if (!supabase) {
  console.error('Failed to initialize Supabase client');
}

export { supabase };

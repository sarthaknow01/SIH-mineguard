import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ylnttsxhxzqurkbpxswe.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_FJBmuqcCsXKRy6pJeJrXTg_5HCzqKPW';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
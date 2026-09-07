import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://tscivyhuuhsijvypefma.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY2l2eWh1dWhzaWp2eXBlZm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTE4MzcsImV4cCI6MjEwNDI2NzgzN30.JaESJiHWrVaM-hrSu_Sj-VlFz_4YsPLh8dd8bFOgScw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

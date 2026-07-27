import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://yickimqwaqdwxpmvbomj.supabase.co';

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY2tpbXF3YXFkd3hwbXZib21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTczOTMsImV4cCI6MjEwMDczMzM5M30.nulRsQ4uobMZ7kLvaWyFPcxqLzWTwoFfqRV1qHAbd_g';

export const supabase = createClient(supabaseUrl, supabaseKey);

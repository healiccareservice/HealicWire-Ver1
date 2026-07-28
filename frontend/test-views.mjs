import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODM0ODIsImV4cCI6MjEwMDM1OTQ4Mn0.oA9oOt7q5gWfGAyMbKublWQsubRbPq4zgF9REnBCLo8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: provs } = await supabase
    .from('providers')
    .select('headline, views, published_at')
    .order('published_at', { ascending: false });
  console.table(provs);
}

test();

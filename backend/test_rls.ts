import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODM0ODIsImV4cCI6MjEwMDM1OTQ4Mn0.oA9oOt7q5gWfGAyMbKublWQsubRbPq4zgF9REnBCLo8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('clinical_insights').select('*').limit(1);
  if (error) {
    console.error("Error reading clinical_insights:", error);
  } else {
    console.log("Success! Data clinical_insights:", data);
  }
}

test();

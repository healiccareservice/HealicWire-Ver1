import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('articles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Data:", data);
  }
}

test();

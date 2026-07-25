import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  const { data, error } = await supabase.from('clinical_insights').select('*');
  console.log("Data:", data);
  if (error) console.error("Error:", error);
}

checkTable();

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function fixRls() {
  const tables = ['drugs', 'treatment_update', 'hospital_alerts', 'current_guidelines', 'providers', 'editorials', 'clinical_insights', 'scientific_events', 'articles', 'repository', 'assets', 'advertisements'];
  
  for (const table of tables) {
    console.log(`Setting up RLS for ${table}...`);
    // Note: We cannot execute DDL directly via supabase-js without an RPC. 
    // However, I will instruct the user to execute the generated SQL in their Supabase SQL editor.
    console.log(`
      ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public read" ON public.${table};
      CREATE POLICY "Allow public read" ON public.${table} FOR SELECT USING (true);
    `);
  }
}

fixRls();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODM0ODIsImV4cCI6MjEwMDM1OTQ4Mn0.oA9oOt7q5gWfGAyMbKublWQsubRbPq4zgF9REnBCLo8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: arts } = await supabase
    .from('articles')
    .select('headline, published_at, created_at')
    .in('headline', [
      'Community Health Centres Upgraded with Comprehensive Obstetric Care',
      'Corporate Hospitals Launch AI-Driven Diagnostic Centers Across Tier 2 Cities',
      'Mandatory NABL Accreditation for All Diagnostic Centres by 2027',
      'IRDAI Mandates Coverage for Inpatient Rehabilitation Centres'
    ]);
  console.log("ARTICLES:");
  console.table(arts);
  
  const { data: provs } = await supabase
    .from('providers')
    .select('headline, published_at, created_at')
    .in('headline', [
      'Community Health Centres Upgraded with Comprehensive Obstetric Care',
      'Corporate Hospitals Launch AI-Driven Diagnostic Centers Across Tier 2 Cities',
      'Mandatory NABL Accreditation for All Diagnostic Centres by 2027',
      'IRDAI Mandates Coverage for Inpatient Rehabilitation Centres'
    ]);
  console.log("PROVIDERS:");
  console.table(provs);
}

test();

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function test() {
  const { data, error } = await supabaseAdmin.rpc('get_policies', {});
  console.log("Policies:", data);
  // Also we can query the pg_policies table
  const { data: policies, error: err } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'user_profiles');
  console.log("pg_policies:", policies, err);
}
test();

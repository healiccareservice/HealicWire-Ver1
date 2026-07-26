import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: '../frontend/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('user_profiles').select('*').or(`name.eq."Dr. Ramya Srinivas",email.eq."Dr. Ramya Srinivas"`).maybeSingle();
  console.log("Anon Data:", data);
  console.log("Anon Error:", error);
}
test();

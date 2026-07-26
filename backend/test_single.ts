import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function test() {
  const { data, error } = await supabaseAdmin.from('user_profiles').select('*').or(`name.eq."Dr. Ramya Srinivas",email.eq."Dr. Ramya Srinivas"`).maybeSingle();
  console.log("Data:", data);
  console.log("Error:", error);
}
test();

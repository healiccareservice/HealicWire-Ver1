import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const { data, error } = await supabaseAdmin
    .from('repository')
    .select('*')
    .order('created_at', { ascending: false });
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();

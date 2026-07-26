import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function dumpProfiles() {
  const { data } = await supabaseAdmin.from("user_profiles").select("*");
  console.log(JSON.stringify(data, null, 2));
}

dumpProfiles();

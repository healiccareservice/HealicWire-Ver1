import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const users = [
  { email: "arjunsharma@gmail.com" },
  { email: "priyanair@gmail.com" },
  { email: "rahulmehta@gmail.com" },
  { email: "snehaiyer@gmail.com" },
  { email: "vikramreddy@gmail.com" },
  { email: "ananyabanerjee@gmail.com" },
  { email: "karthikrao@gmail.com" },
  { email: "meerajoshi@gmail.com" },
  { email: "sandeepkulkarni@gmail.com" },
  { email: "rituverma@gmail.com" },
  { email: "nikhildesai@gmail.com" },
  { email: "poojakapoor@gmail.com" },
  { email: "ajaymenon@gmail.com" },
  { email: "kavitapatil@gmail.com" },
  { email: "rohitchandra@gmail.com" },
  { email: "nehagupta@gmail.com" },
  { email: "harishbhat@gmail.com" },
  { email: "shalinikrishnan@gmail.com" },
  { email: "vivekagarwal@gmail.com" },
  { email: "aditisingh@gmail.com" }
];

async function main() {
  console.log("Fetching all auth users...");
  let allUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 1000
    });
    if (listError) {
      console.error("Failed to list users:", listError.message);
      break;
    }
    allUsers = allUsers.concat(listData.users);
    if (listData.users.length < 1000) break;
    page++;
  }
  
  for (const user of users) {
    const authUser = allUsers.find(u => u.email === user.email);
    if (!authUser) {
      console.error(`ERROR: User ${user.email} not found.`);
      continue;
    }
    
    console.log(`Updating password for ${user.email} (ID: ${authUser.id})...`);
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: "User@2026"
    });
    
    if (error) {
      console.error(`Failed to update password for ${user.email}:`, error.message);
    } else {
      console.log(`SUCCESS: Password updated for ${user.email}`);
    }
  }
  
  console.log("\nFinished updating all passwords!");
}

main();

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

async function addAdmin(user: any) {
  console.log(`\n--- Processing user: ${user.email} ---`);
  
  // 1. Try to create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      name: user.name,
      role: user.role,
      permissions: [user.permissions],
      degree: user.degree
    }
  });

  if (authError) {
    console.log(`createUser returned error:`, authError.message);
  } else {
    console.log(`Successfully created auth user: ${authData.user.email}`);
  }

  // 2. We need the auth user ID, so let's find it.
  console.log(`Fetching user list to find ID for ${user.email}...`);
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  
  if (listError) {
    console.error("Failed to list users:", listError.message);
    return;
  }
  
  const authUser = listData.users.find(u => u.email === user.email);
  if (!authUser) {
    console.error(`ERROR: User ${user.email} not found in the first 1000 users.`);
    return;
  }
  
  console.log(`Found auth user ID: ${authUser.id}`);

  // 3. Upsert user_profiles
  console.log(`Upserting profile for ${user.email}...`);
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: authUser.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: [user.permissions],
      control_access: user.control_access,
      degree: user.degree
    });

  if (profileError) {
    console.error(`Failed to upsert profile for ${user.email}:`, profileError.message);
  } else {
    console.log(`SUCCESS: Upserted profile for ${user.email}`);
  }
}

async function main() {
  await addAdmin({
    email: 'drnarayanak@gmail.com',
    password: 'Tata@#viDhya#2026',
    name: 'Dr Narayana K',
    degree: 'MBBS, MD, DipIBLM, FHPE',
    role: 'Chief Editor',
    permissions: 'editorial',
    control_access: 'Super Admin'
  });

  await addAdmin({
    email: 'kishanpradeep84@gmail.com',
    password: 'DeVanaHalli-#@Pradeep#2026',
    name: 'Dr Pradeep',
    degree: 'MBBS, MD',
    role: 'Editor',
    permissions: 'editorial',
    control_access: 'Admin'
  });
}

main();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEditorialUser() {
  console.log("Creating editorial user: ramyasrinivas14@gmail.com...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'ramyasrinivas14@gmail.com',
    password: 'UserRamya@2026',
    email_confirm: true,
    user_metadata: {
      name: 'Dr. Ramya Srinivas',
      role: 'Editorial Access',
      permissions: ['editorial']
    }
  });

  if (error) {
    console.error("Failed to create user:", error.message);
  } else {
    console.log("Successfully created user:", data.user.email);
    console.log("User metadata:", data.user.user_metadata);
  }
}

createEditorialUser();

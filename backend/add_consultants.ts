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
  { name: "Dr. Arjun Sharma", degree: "MBBS, MD (General Medicine), DM (Cardiology)", role: "Consultant Cardiologist", email: "arjunsharma@healicwire.com" },
  { name: "Dr. Priya Nair", degree: "MBBS, MD (General Medicine), DM (Endocrinology)", role: "Consultant Endocrinologist & Diabetologist", email: "priyanair@healicwire.com" },
  { name: "Dr. Rahul Mehta", degree: "MBBS, MD (General Medicine), DM (Neurology)", role: "Consultant Neurologist", email: "rahulmehta@healicwire.com" },
  { name: "Dr. Sneha Iyer", degree: "MBBS, MD (General Medicine), DM (Nephrology)", role: "Consultant Nephrologist", email: "snehaiyer@healicwire.com" },
  { name: "Dr. Vikram Reddy", degree: "MBBS, MD (General Medicine), DM (Gastroenterology)", role: "Consultant Gastroenterologist", email: "vikramreddy@healicwire.com" },
  { name: "Dr. Ananya Banerjee", degree: "MBBS, MD (General Medicine), DM (Medical Oncology)", role: "Consultant Medical Oncologist", email: "ananyabanerjee@healicwire.com" },
  { name: "Dr. Karthik Rao", degree: "MBBS, MD (General Medicine), DM (Clinical Hematology)", role: "Consultant Hematologist", email: "karthikrao@healicwire.com" },
  { name: "Dr. Meera Joshi", degree: "MBBS, MD (General Medicine), DM (Clinical Immunology & Rheumatology)", role: "Consultant Rheumatologist", email: "meerajoshi@healicwire.com" },
  { name: "Dr. Sandeep Kulkarni", degree: "MBBS, MD (General Medicine), DM (Pulmonary, Critical Care & Sleep Medicine)", role: "Consultant Pulmonologist", email: "sandeepkulkarni@healicwire.com" },
  { name: "Dr. Ritu Verma", degree: "MBBS, MD (General Medicine), DM (Medical Genetics)", role: "Consultant Medical Geneticist", email: "rituverma@healicwire.com" },
  { name: "Dr. Nikhil Desai", degree: "MBBS, MS (General Surgery), MCh (Urology)", role: "Consultant Urologist", email: "nikhildesai@healicwire.com" },
  { name: "Dr. Pooja Kapoor", degree: "MBBS, MS (General Surgery), MCh (Neurosurgery)", role: "Consultant Neurosurgeon", email: "poojakapoor@healicwire.com" },
  { name: "Dr. Ajay Menon", degree: "MBBS, MS (General Surgery), MCh (Cardiothoracic & Vascular Surgery)", role: "Consultant Cardiothoracic Surgeon", email: "ajaymenon@healicwire.com" },
  { name: "Dr. Kavita Patil", degree: "MBBS, MS (General Surgery), MCh (Surgical Oncology)", role: "Consultant Surgical Oncologist", email: "kavitapatil@healicwire.com" },
  { name: "Dr. Rohit Chandra", degree: "MBBS, MS (General Surgery), MCh (Plastic & Reconstructive Surgery)", role: "Consultant Plastic & Reconstructive Surgeon", email: "rohitchandra@healicwire.com" },
  { name: "Dr. Neha Gupta", degree: "MBBS, MD (Pediatrics), DM (Pediatric Neurology)", role: "Consultant Pediatric Neurologist", email: "nehagupta@healicwire.com" },
  { name: "Dr. Harish Bhat", degree: "MBBS, MD (General Medicine), DM (Infectious Diseases)", role: "Consultant Infectious Disease Specialist", email: "harishbhat@healicwire.com" },
  { name: "Dr. Shalini Krishnan", degree: "MBBS, MD (General Medicine), DM (Clinical Pharmacology)", role: "Consultant Clinical Pharmacologist", email: "shalinikrishnan@healicwire.com" },
  { name: "Dr. Vivek Agarwal", degree: "MBBS, MD (General Medicine), DM (Critical Care Medicine)", role: "Consultant Intensivist & Critical Care Specialist", email: "vivekagarwal@healicwire.com" },
  { name: "Dr. Aditi Singh", degree: "MBBS, MD (Radiodiagnosis), Fellowship in Interventional Radiology", role: "Consultant Interventional Radiologist", email: "aditisingh@healicwire.com" }
];

async function addConsultant(user: any, index: number) {
  console.log(`\n--- Processing user: ${user.email} ---`);
  
  // Use a generic password
  const password = "HealicWire@2026";
  const avatarUrl = `/images/${index % 10}.jpg`; // Assuming there are images 0.jpg to 9.jpg

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: user.name,
      role: user.role,
      permissions: ['clinical_insights'],
      degree: user.degree,
      avatar_url: avatarUrl
    }
  });

  if (authError) {
    console.log(`createUser returned error:`, authError.message);
  } else {
    console.log(`Successfully created auth user: ${authData.user.email}`);
  }

  console.log(`Fetching user list to find ID for ${user.email}...`);
  // Note: Since listUsers returns by default 50 users and we might have more, let's make sure we page correctly or just use getUserById if possible. But listUsers works for small numbers.
  // Actually, we can fetch all users.
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
  
  const authUser = allUsers.find(u => u.email === user.email);
  if (!authUser) {
    console.error(`ERROR: User ${user.email} not found.`);
    return;
  }
  
  console.log(`Found auth user ID: ${authUser.id}`);

  // Upsert user_profiles
  console.log(`Upserting profile for ${user.email}...`);
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: authUser.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: ['clinical_insights'],
      degree: user.degree,
      avatar_url: avatarUrl
    });

  if (profileError) {
    console.error(`Failed to upsert profile for ${user.email}:`, profileError.message);
  } else {
    console.log(`SUCCESS: Upserted profile for ${user.email}`);
  }
}

async function main() {
  for (let i = 0; i < users.length; i++) {
    await addConsultant(users[i], i);
  }
  console.log("\nFinished adding all consultants!");
}

main();

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const bannerItems = [
  { 
    title: 'Global Cardio Summit 2026', 
    subtitle: 'Join leading experts for breakthroughs in cardiovascular care.',
    img: '/marquee/scientific_events.png',
    category: 'Event',
    date: '2026-08-15'
  },
  { 
    title: 'World Health Organization', 
    subtitle: 'World Mental Health Day - October 10th',
    img: '/marquee/health_days.png',
    category: 'Brand',
    date: '2026-08-10'
  },
  { 
    title: 'Apollo Hospitals', 
    subtitle: 'Experience state-of-the-art robotic surgery for precision care.',
    img: '/marquee/hospital_ads.png',
    category: 'Hospital',
    date: '2026-08-05'
  },
  { 
    title: 'HealicWire Wellness', 
    subtitle: 'Manage hypertension effectively with low-sodium diets and daily walks.',
    img: '/marquee/health_tips.png',
    category: 'Brand',
    date: '2026-08-01'
  },
  { 
    title: 'Ministry of Health & Family Welfare', 
    subtitle: 'Updated guidelines released for seasonal influenza vaccination.',
    img: '/marquee/health_info.png',
    category: 'Brand',
    date: '2026-07-25'
  }
];

async function seed() {
  console.log("Seeding public.repository table...");

  for (const item of bannerItems) {
    const { data, error } = await supabase
      .from("repository")
      .insert([
        {
          title: item.title,
          product_name: item.category, // Mapped category to product_name
          details: item.subtitle,
          promotion_image: item.img
        },
      ]);

    if (error) {
      console.error(`Failed to insert ${item.title}:`, error.message);
    } else {
      console.log(`Inserted ${item.title}`);
    }
  }

  console.log("Seeding complete!");
}

seed();

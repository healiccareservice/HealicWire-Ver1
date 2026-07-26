const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '../frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODM0ODIsImV4cCI6MjEwMDM1OTQ4Mn0.oA9oOt7q5gWfGAyMbKublWQsubRbPq4zgF9REnBCLo8';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const newEvt = {
    title: 'National Cardiology Summit 2026',
    organizer: 'HealicWire Academic Directorate',
    scope: 'Nationwide',
    event_type: 'Conference',
    start_date: '2026-07-23T00:00:00Z',
    end_date: '2026-07-25T00:00:00Z',
    venue: 'Main Medical Auditorium',
    city: 'New Delhi',
    country: 'India',
    format: 'Hybrid',
    specialties: ['Cardiology', 'Internal Medicine'],
    cme_credits: 12,
    description: 'National Cardiology Summit 2026 covering advancements in stent technology, heart failure management, and preventive cardiology.',
    cost: 'Complimentary / CME Accredited',
    registration_url: '#',
    managed: 'Managed',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    status: 'Approved'
  };
  const { data, error } = await supabase.from('scientific_events').insert([newEvt]).select();
  if (error) console.error('Error inserting:', error);
  else console.log('Successfully inserted:', data);
})();

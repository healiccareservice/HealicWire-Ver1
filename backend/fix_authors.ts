import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jkquqwxaopqszcnlnxti.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc');

const authors = [
  { name: 'Dr. Arjun Sharma', qual: 'MBBS, MD (General Medicine), DM (Cardiology)', title: 'Consultant Cardiologist' },
  { name: 'Dr. Rahul Mehta', qual: 'MBBS, MD (General Medicine), DM (Neurology)', title: 'Consultant Neurologist' },
  { name: 'Dr. Sneha Iyer', qual: 'MBBS, MD (General Medicine), DM (Nephrology)', title: 'Consultant Nephrologist' },
  { name: 'Dr. Vikram Reddy', qual: 'MBBS, MD (General Medicine), DM (Gastroenterology)', title: 'Consultant Gastroenterologist' },
  { name: 'Dr. Ananya Banerjee', qual: 'MBBS, MD (General Medicine), DM (Medical Oncology)', title: 'Consultant Medical Oncologist' },
  { name: 'Dr. Karthik Rao', qual: 'MBBS, MD (General Medicine), DM (Clinical Hematology)', title: 'Consultant Hematologist' },
  { name: 'Dr. Meera Joshi', qual: 'MBBS, MD (General Medicine), DM (Clinical Immunology & Rheumatology)', title: 'Consultant Rheumatologist' },
  { name: 'Dr. Sandeep Kulkarni', qual: 'MBBS, MD (General Medicine), DM (Pulmonary, Critical Care & Sleep Medicine)', title: 'Consultant Pulmonologist' },
  { name: 'Dr. Ritu Verma', qual: 'MBBS, MD (General Medicine), DM (Medical Genetics)', title: 'Consultant Medical Geneticist' },
  { name: 'Dr. Nikhil Desai', qual: 'MBBS, MS (General Surgery), MCh (Urology)', title: 'Consultant Urologist' },
  { name: 'Dr. Pooja Kapoor', qual: 'MBBS, MS (General Surgery), MCh (Neurosurgery)', title: 'Consultant Neurosurgeon' },
  { name: 'Dr. Ajay Menon', qual: 'MBBS, MS (General Surgery), MCh (Cardiothoracic & Vascular Surgery)', title: 'Consultant Cardiothoracic Surgeon' },
  { name: 'Dr. Kavita Patil', qual: 'MBBS, MS (General Surgery), MCh (Surgical Oncology)', title: 'Consultant Surgical Oncologist' },
  { name: 'Dr. Rohit Chandra', qual: 'MBBS, MS (General Surgery), MCh (Plastic & Reconstructive Surgery)', title: 'Consultant Plastic & Reconstructive Surgeon' },
  { name: 'Dr. Neha Gupta', qual: 'MBBS, MD (Pediatrics), DM (Pediatric Neurology)', title: 'Consultant Pediatric Neurologist' },
  { name: 'Dr. Harish Bhat', qual: 'MBBS, MD (General Medicine), DM (Infectious Diseases)', title: 'Consultant Infectious Disease Specialist' },
  { name: 'Dr. Shalini Krishnan', qual: 'MBBS, MD (General Medicine), DM (Clinical Pharmacology)', title: 'Consultant Clinical Pharmacologist' },
  { name: 'Dr. Vivek Agarwal', qual: 'MBBS, MD (General Medicine), DM (Critical Care Medicine)', title: 'Consultant Intensivist & Critical Care Specialist' },
  { name: 'Dr. Aditi Singh', qual: 'MBBS, MD (Radiodiagnosis), Fellowship in Interventional Radiology', title: 'Consultant Interventional Radiologist' }
];

async function fixData() {
  const { data } = await supabase.from('clinical_insights').select('id').order('created_at', { ascending: true });
  // Skip the first one if there are 20, we need the last 19
  const targets = data.slice(-19);
  
  for (let i = 0; i < targets.length; i++) {
    const res = await supabase.from('clinical_insights')
      .update({ 
        author_name: authors[i].name, 
        author_qualifications: authors[i].qual, 
        author_title: authors[i].title 
      })
      .eq('id', targets[i].id);
    console.log('Updated ' + authors[i].name + ' error: ' + (res.error ? res.error.message : 'null'));
  }
}
fixData().catch(console.error);

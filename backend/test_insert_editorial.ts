import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertDummyEditorial() {
  const dummy = {
    headline: "The Future of AI in Medicine: Why We Must Adapt",
    subhead: "A critical look at the integration of artificial intelligence in daily clinical practice and its implications for medical education.",
    summary_30s: "Artificial intelligence is no longer a futuristic concept but a present reality in healthcare. Its adoption requires a paradigm shift in how we train the next generation of physicians.",
    summary_2min: "As AI tools become more sophisticated, their integration into diagnostic workflows is inevitable. This editorial explores the necessary changes in medical curricula to prepare students for a collaborative future with AI, emphasizing the balance between technological reliance and clinical intuition.",
    body_analysis: "The rapid advancement of AI in healthcare presents both unprecedented opportunities and unique challenges. While AI algorithms can analyze vast datasets with incredible speed and accuracy, they lack the nuanced understanding and empathy that human clinicians provide.\n\nTo fully realize the benefits of AI, medical education must evolve. We need to move beyond traditional rote memorization and focus on developing skills such as critical thinking, data interpretation, and ethical decision-making in the context of AI-assisted care.",
    why_this_matters: "Preparing for an AI-integrated future ensures that healthcare professionals remain at the forefront of patient care, utilizing technology to enhance rather than replace human judgment.",
    what_changed: "The focus is shifting from AI as a theoretical concept to its practical application in clinical settings.",
    category: "Editorial",
    specialties: ["General Practice", "Medical Education"],
    region: "Global",
    published_at: new Date().toISOString(),
    status: "published",
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    image_credit: "Unsplash",
    image_type: "editorial",
    reading_time_minutes: 5,
    source_name: "HealicWire Editorial Board",
    source_url: "",
    source_published_at: new Date().toISOString(),
    evidence_level: "Expert Opinion",
    is_ai_assisted: false,
    impact_scores: { "clinical": 8, "research": 6, "policy": 7 },
    india_relevance: "High relevance as India rapidly adopts digital health technologies.",
    peer_reviewed: false
  };

  const { data, error } = await supabase.from('editorials').insert(dummy).select();
  if (error) {
    console.error("Error inserting editorial:", error);
  } else {
    console.log("Success! Inserted editorial:", data);
  }
}

insertDummyEditorial();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertDummy() {
  const dummyInsight = {
    article_title: "Advances in Continuous Glucose Monitoring (CGM) for Type 2 Diabetes Management",
    detailed_article: "The integration of Continuous Glucose Monitoring (CGM) systems into the routine care of non-insulin-treated Type 2 Diabetes Mellitus (T2DM) represents a paradigm shift. Recent real-world data demonstrates that intermittent or continuous use of these devices significantly improves glycemic control by providing actionable biofeedback to patients.",
    recent_clinical_update: "New guidelines now endorse the use of CGM in adults with T2DM on basal insulin or those who are at high risk of hypoglycemia, moving away from the previous insulin-only mandate.",
    why_this_matters: "By offering real-time insights into postprandial glucose excursions, clinicians can tailor lifestyle and pharmacological interventions more precisely, potentially delaying disease progression.",
    clinical_pearls: "- CGM data is most effective when paired with structured patient education.\n- Time-in-Range (TIR) goal should generally be >70% (70-180 mg/dL).\n- A 5% increase in TIR correlates with clinically significant reductions in HbA1c.",
    future_directions: "Future iterations of CGM technology are focusing on closed-loop algorithms integrated with oral multi-drug regimens and dual-hormone sensing (glucose and ketones).",
    evidence_summary: "The MOBILE trial showed a significant reduction in HbA1c (-1.1% vs -0.6%) for basal-insulin treated T2DM patients using CGM compared to traditional blood glucose monitoring.",
    references: "1. Martens T, et al. JAMA. 2021;325(22):2262-2272.\n2. American Diabetes Association (ADA) Standards of Care in Diabetes—2024."
  };

  const { data, error } = await supabase.from('clinical_insights').insert(dummyInsight).select();
  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Success! Inserted:", data);
  }
}

insertDummy();

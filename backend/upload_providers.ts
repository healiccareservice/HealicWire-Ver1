import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { initialArticles } from './src/initial_db.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const providerArticles = initialArticles.filter(a => a.category === "Providers");
  console.log(`Found ${providerArticles.length} provider articles in initial_db.ts`);
  
  if (providerArticles.length === 0) {
      console.log("No provider articles found.");
      return;
  }
  
  for (const a of providerArticles) {
    const payload = {
        slug: a.slug,
        headline: a.headline,
        subhead: a.subhead,
        category: a.category,
        specialties: a.specialties || [],
        region: a.region,
        image_url: a.imageUrl,
        image_credit: a.imageCredit,
        image_type: a.imageType,
        published_at: a.publishedAt,
        source_published_at: a.sourcePublishedAt,
        reading_time_minutes: a.readingTimeMinutes,
        status: a.status || 'published',
        source_name: a.sourceName,
        source_url: a.sourceUrl,
        evidence_level: a.evidenceLevel,
        is_ai_assisted: a.isAiAssisted || false,
        summary_30s: a.summary30s,
        summary_2min: a.summary2min,
        body_analysis: a.bodyAnalysis,
        why_this_matters: a.whyThisMatters,
        impact_scores: a.impactScores,
        india_relevance: a.indiaRelevance,
        peer_reviewed: a.peerReviewed || false,
        funding_source: a.fundingSource,
        coi_note: a.coiNote,
        study_design: a.studyDesign,
        sample_size: a.sampleSize,
        learning_module: a.learningModule,
        fact_check_claims: a.factCheckClaims,
        clinical_impact_score: a.clinicalImpactScore,
        views: a.views || 0,
        author_name: a.author_name,
        author_title: a.author_title,
        seo_description: a.seoDescription,
        keywords: a.keywords
    };
    
    // We can't delete by id since they are different format, 
    // but we can delete by slug just in case.
    await supabase.from('providers').delete().eq('slug', a.slug);
    
    const { error } = await supabase.from('providers').insert(payload);
    if (error) {
        console.error(`Error inserting ${a.slug}:`, error);
    } else {
        console.log(`Inserted ${a.slug} successfully.`);
    }
  }
}

run();

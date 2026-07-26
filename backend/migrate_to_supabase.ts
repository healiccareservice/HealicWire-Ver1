import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DB_FILE = path.join(process.cwd(), 'db.json');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MzQ4MiwiZXhwIjoyMTAwMzU5NDgyfQ.gb6rrU9HG7dLobFg2ihFDfvqchw3XvcxlW3eHNDtQCc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log("Starting migration from db.json to Supabase...");
  if (!fs.existsSync(DB_FILE)) {
    console.error("db.json not found!");
    return;
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(raw);

  // 1. Migrate Articles
  if (db.articles && db.articles.length > 0) {
    console.log(`Migrating ${db.articles.length} articles...`);
    for (const a of db.articles) {
      const payload = {
        slug: a.slug || a.id,
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
        is_ai_assisted: a.isAIAssisted || false,
        summary_30s: a.summary30s,
        summary_2min: a.summary2min,
        body_analysis: a.bodyAnalysis,
        why_this_matters: a.whyThisMatters,
        what_changed: a.whatChanged,
        impact_scores: a.impactScores,
        india_relevance: a.indiaRelevance,
        peer_reviewed: a.peerReviewed || false,
        funding_source: a.fundingSource,
        coi_note: a.coiNote,
        study_design: a.studyDesign,
        sample_size: a.sampleSize,
        "references": a.references || [],
        learning_module: a.learningModule,
        fact_check_claims: a.factCheckClaims,
        clinical_impact_score: a.clinicalImpactScore
      };
      const { error } = await supabase.from('articles').insert(payload);
      if (error) console.error("Error inserting article:", a.headline, error.message);
    }
  }

  // 2. Migrate Hospital Alerts
  if (db.alerts && db.alerts.length > 0) {
    console.log(`Migrating ${db.alerts.length} hospital alerts...`);
    for (const a of db.alerts) {
      const payload = {
        headline: a.headline,
        severity: a.severity,
        urgency: a.urgency,
        departments_affected: a.departmentsAffected || [],
        recommended_action: a.recommendedAction,
        source: a.source,
        date: a.date
      };
      const { error } = await supabase.from('hospital_alerts').insert(payload);
      if (error) console.error("Error inserting alert:", a.headline, error.message);
    }
  }

  // 3. Migrate Current Guidelines
  if (db.guidelines && db.guidelines.length > 0) {
    console.log(`Migrating ${db.guidelines.length} current guidelines...`);
    for (const g of db.guidelines) {
      const payload = {
        condition: g.condition,
        issuing_organization: g.issuingOrganization,
        current_recommendation: g.currentRecommendation,
        previous_recommendation: g.previousRecommendation,
        last_updated: g.lastUpdated,
        reason_for_change: g.reasonForChange,
        india_relevance: g.indiaRelevance,
        "references": g.references || []
      };
      const { error } = await supabase.from('current_guidelines').insert(payload);
      if (error) console.error("Error inserting guideline:", g.condition, error.message);
    }
  }

  // 4. Migrate Scientific Events
  if (db.events && db.events.length > 0) {
    console.log(`Migrating ${db.events.length} scientific events...`);
    for (const e of db.events) {
      const payload = {
        title: e.title,
        organizer: e.organizer,
        scope: e.scope,
        event_type: e.eventType,
        target_professions: e.targetProfessions || [],
        start_date: e.startDate,
        end_date: e.endDate,
        duration: e.duration,
        venue: e.venue,
        city: e.city,
        state: e.state,
        country: e.country,
        institution: e.institution,
        format: e.format,
        specialties: e.specialties || [],
        cme_credits: e.cmeCredits,
        cme_accreditation_body: e.cmeAccreditationBody,
        description: e.description,
        objectives: e.objectives || [],
        abstract_deadline: e.abstractDeadline,
        registration_deadline: e.registrationDeadline,
        early_bird_deadline: e.earlyBirdDeadline,
        early_bird_cost: e.earlyBirdCost,
        cost: e.cost,
        seats_available: e.seatsAvailable,
        seats_left: e.seatsLeft,
        is_live: e.isLive || false,
        status: e.status || 'Approved',
        image_url: e.imageUrl,
        poster_url: e.posterUrl,
        keynote_speakers: e.keynoteSpeakers || [],
        speaker_profiles: e.speakerProfiles || [],
        schedule: e.schedule || [],
        venue_map_url: e.venueMapUrl,
        registration_url: e.registrationUrl,
        submission_url: e.submissionUrl,
        ai_summary: e.aiSummary
      };
      const { error } = await supabase.from('scientific_events').insert(payload);
      if (error) console.error("Error inserting event:", e.title, error.message);
    }
  }

  console.log("Migration complete!");
}

migrate();

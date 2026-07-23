/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Article, HospitalAlert, LivingGuideline, ScientificEvent } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODM0ODIsImV4cCI6MjEwMDM1OTQ4Mn0.oA9oOt7q5gWfGAyMbKublWQsubRbPq4zgF9REnBCLo8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const mapArticleFromDB = (dbArticle: any): Article => {
  return {
    ...dbArticle,
    imageUrl: dbArticle.image_url,
    imageCredit: dbArticle.image_credit,
    imageType: dbArticle.image_type,
    publishedAt: dbArticle.published_at,
    sourcePublishedAt: dbArticle.source_published_at,
    readingTimeMinutes: dbArticle.reading_time_minutes,
    sourceName: dbArticle.source_name,
    sourceUrl: dbArticle.source_url,
    evidenceLevel: dbArticle.evidence_level,
    isAIAssisted: dbArticle.is_ai_assisted,
    summary30s: dbArticle.summary_30s,
    summary2min: dbArticle.summary_2min,
    bodyAnalysis: dbArticle.body_analysis,
    whyThisMatters: dbArticle.why_this_matters,
    whatChanged: dbArticle.what_changed,
    impactScores: dbArticle.impact_scores,
    indiaRelevance: dbArticle.india_relevance,
    peerReviewed: dbArticle.peer_reviewed,
    fundingSource: dbArticle.funding_source,
    coiNote: dbArticle.coi_note,
    studyDesign: dbArticle.study_design,
    sampleSize: dbArticle.sample_size,
    learningModule: dbArticle.learning_module,
    factCheckClaims: dbArticle.fact_check_claims,
    clinicalImpactScore: dbArticle.clinical_impact_score,
  } as Article;
};

export const mapAlertFromDB = (dbAlert: any): HospitalAlert => {
  return {
    ...dbAlert,
    departmentsAffected: dbAlert.departments_affected,
    recommendedAction: dbAlert.recommended_action,
  } as HospitalAlert;
};

export const mapGuidelineFromDB = (dbGuideline: any): LivingGuideline => {
  return {
    ...dbGuideline,
    issuingOrganization: dbGuideline.issuing_organization,
    currentRecommendation: dbGuideline.current_recommendation,
    previousRecommendation: dbGuideline.previous_recommendation,
    lastUpdated: dbGuideline.last_updated,
    reasonForChange: dbGuideline.reason_for_change,
    indiaRelevance: dbGuideline.india_relevance,
  } as LivingGuideline;
};

export const mapEventFromDB = (dbEvent: any): ScientificEvent => {
  return {
    ...dbEvent,
    eventType: dbEvent.event_type,
    targetProfessions: dbEvent.target_professions,
    startDate: dbEvent.start_date,
    endDate: dbEvent.end_date,
    cmeCredits: dbEvent.cme_credits,
    cmeAccreditationBody: dbEvent.cme_accreditation_body,
    abstractDeadline: dbEvent.abstract_deadline,
    registrationDeadline: dbEvent.registration_deadline,
    earlyBirdDeadline: dbEvent.early_bird_deadline,
    earlyBirdCost: dbEvent.early_bird_cost,
    seatsAvailable: dbEvent.seats_available,
    seatsLeft: dbEvent.seats_left,
    isLive: dbEvent.is_live,
    imageUrl: dbEvent.image_url,
    posterUrl: dbEvent.poster_url,
    keynoteSpeakers: dbEvent.keynote_speakers,
    speakerProfiles: dbEvent.speaker_profiles,
    venueMapUrl: dbEvent.venue_map_url,
    registrationUrl: dbEvent.registration_url,
    submissionUrl: dbEvent.submission_url,
    aiSummary: dbEvent.ai_summary,
  } as ScientificEvent;
};

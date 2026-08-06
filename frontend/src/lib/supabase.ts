/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Article, HospitalAlert, LivingGuideline, ScientificEvent } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jkquqwxaopqszcnlnxti.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXVxd3hhb3Bxc3pjbmxueHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODM0ODIsImV4cCI6MjEwMDM1OTQ4Mn0.oA9oOt7q5gWfGAyMbKublWQsubRbPq4zgF9REnBCLo8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options) => {
      const res = await fetch(url, options);
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          Object.keys(window.localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              window.localStorage.removeItem(key);
            }
          });
        }
      }
      return res;
    }
  }
});

export const mapArticleFromDB = (dbArticle: any): Article => {
  const headline = dbArticle.headline || dbArticle.title || dbArticle.condition || dbArticle.name || 'Untitled';
  const fallbackImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(headline + ' modern healthcare high quality photography')}?width=800&height=600&nologo=true`;
  
  const finalImageUrl = dbArticle.image_url || fallbackImage;

  return {
    ...dbArticle,
    category: dbArticle.category === 'Providers' || dbArticle.category === 'Health Care Providers' ? 'Healthcare Providers' : (dbArticle.category || 'News'),
    headline,
    imageUrl: finalImageUrl,
    spotlight: dbArticle.spotlight || false,
    imageCredit: dbArticle.image_credit,
    imageType: dbArticle.image_type,
    publishedAt: dbArticle.published_at || dbArticle.start_date || dbArticle.last_updated || dbArticle.date,
    sourcePublishedAt: dbArticle.source_published_at,
    readingTimeMinutes: dbArticle.reading_time_minutes,
    sourceName: dbArticle.source_name || dbArticle.author_name || dbArticle.organizer || dbArticle.issuing_organization || dbArticle.source || 'HealicWire',
    sourceUrl: dbArticle.source_url || dbArticle.registration_url,
    evidenceLevel: dbArticle.evidence_level,
    isAIAssisted: dbArticle.is_ai_assisted,
    summary30s: dbArticle.summary_30s || dbArticle.description || dbArticle.current_recommendation || dbArticle.recommended_action || '',
    summary2min: dbArticle.summary_2min,
    bodyAnalysis: dbArticle.body_analysis || (dbArticle.current_recommendation ? `
### Guideline Details
**Condition**: ${dbArticle.condition || 'N/A'}
**Issuing Organization**: ${dbArticle.issuing_organization || 'N/A'}
**Current Recommendation**: ${dbArticle.current_recommendation || 'N/A'}
**Previous Recommendation**: ${dbArticle.previous_recommendation || 'N/A'}
**Reason for Change**: ${dbArticle.reason_for_change || 'N/A'}
**India Relevance**: ${dbArticle.india_relevance || 'N/A'}
**References**: ${dbArticle.references || 'N/A'}
    `.trim() : ''),
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
    title: dbArticle.title,
    clinicalSpecialty: dbArticle.clinical_specialty,
    clinicalImpact: dbArticle.clinical_impact,
    clinicalQuestion: dbArticle.clinical_question,
    studySummary: dbArticle.study_summary,
    keyTreatmentUpdate: dbArticle.key_treatment_update,
    clinicalImplications: dbArticle.clinical_implications,
    patientPopulation: dbArticle.patient_population,
    strengthOfEvidence: dbArticle.strength_of_evidence,
    limitations: dbArticle.limitations,
    bottomLine: dbArticle.bottom_line,
    source: dbArticle.source,
    officialReferences: dbArticle.official_references,

    // Pharma & Drugs AI fields
    updateCategory: dbArticle.update_category,
    issuingOrganization: dbArticle.issuing_organization,
    releaseDate: dbArticle.release_date,
    drugName: dbArticle.drug_name,
    therapeuticArea: dbArticle.therapeutic_area,
    summary: dbArticle.summary,
    clinicalSignificance: dbArticle.clinical_significance,
    recommendedActions: dbArticle.recommended_actions,
    affectedPatientPopulation: dbArticle.affected_patient_population,
    regulatoryStatus: dbArticle.regulatory_status,
    evidenceSource: dbArticle.evidence_source,
    officialReference: dbArticle.official_reference,

    // Health Care Providers AI fields
    hospitalAgency: dbArticle.hospital_agency,
    keyHighlights: dbArticle.key_highlights,
    clinicalOperationalImpact: dbArticle.clinical_operational_impact,
    applicability: dbArticle.applicability,
    currentStatus: dbArticle.current_status,
  } as Article;
};

export const mapAlertFromDB = (dbAlert: any): HospitalAlert => {
  return {
    ...dbAlert,
    departmentsAffected: dbAlert.departments_affected,
    recommendedAction: dbAlert.recommended_action,
    alertCategory: dbAlert.alert_category,
    whoIsAffected: dbAlert.who_is_affected,
    recommendedHospitalActions: dbAlert.recommended_hospital_actions,
    departmentsImpacted: dbAlert.departments_impacted,
    effectiveDate: dbAlert.effective_date,
    geographicCoverage: dbAlert.geographic_coverage,
    currentStatus: dbAlert.current_status,
    evidenceSource: dbAlert.evidence_source,
    officialReference: dbAlert.official_reference,
  } as HospitalAlert;
};

export const mapGuidelineFromDB = (dbGuideline: any): LivingGuideline => {
  return {
    ...dbGuideline,
    issuingOrganization: dbGuideline.issuing_organization,
    currentRecommendation: dbGuideline.current_recommendation,
    previousRecommendation: dbGuideline.previous_recommendation,
    lastUpdated: dbGuideline.last_updated,
    spotlight: dbGuideline.spotlight || false,
    reasonForChange: dbGuideline.reason_for_change,
    indiaRelevance: dbGuideline.india_relevance,
    title: dbGuideline.title,
    imageUrl: dbGuideline.image_url || `https://image.pollinations.ai/prompt/${encodeURIComponent((dbGuideline.title || dbGuideline.condition || 'Healthcare') + ' medical high quality photography')}?width=800&height=600&nologo=true`,
    publicationYear: dbGuideline.publication_year,
    targetAudience: dbGuideline.target_audience,
    keyClinicalRecommendations: dbGuideline.key_clinical_recommendations,
    whatsNew: dbGuideline.whats_new,
    clinicalPearls: dbGuideline.clinical_pearls,
    evidenceLevel: dbGuideline.evidence_level,
  } as LivingGuideline;
};

export const mapEventFromDB = (dbEvent: any): ScientificEvent => {
  const title = dbEvent.title || dbEvent.headline || 'Medical Event';
  const fallbackImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(title + ' medical conference high quality photography')}?width=800&height=600&nologo=true`;
  
  const finalImageUrl = dbEvent.image_url || fallbackImage;
  const finalPosterUrl = dbEvent.poster_url || fallbackImage;

  return {
    ...dbEvent,
    eventType: dbEvent.event_type,
    targetProfessions: dbEvent.target_professions,
    targetAudience: dbEvent.target_audience,
    startDate: dbEvent.start_date,
    endDate: dbEvent.end_date,
    cmeCredits: dbEvent.cme_credits,
    spotlight: dbEvent.spotlight || false,
    cmeAccreditationBody: dbEvent.cme_accreditation_body,
    abstractDeadline: dbEvent.abstract_deadline,
    registrationDeadline: dbEvent.registration_deadline,
    earlyBirdDeadline: dbEvent.early_bird_deadline,
    earlyBirdCost: dbEvent.early_bird_cost,
    seatsAvailable: dbEvent.seats_available,
    seatsLeft: dbEvent.seats_left,
    isLive: dbEvent.is_live,
    imageUrl: finalImageUrl,
    posterUrl: finalPosterUrl,
    keynoteSpeakers: dbEvent.keynote_speakers,
    speakerProfiles: dbEvent.speaker_profiles,
    venueMapUrl: dbEvent.venue_map_url,
    registrationUrl: dbEvent.registration_url,
    submissionUrl: dbEvent.submission_url,
    aiSummary: dbEvent.ai_summary,
    
    // New AI fields
    medicalSpecialty: dbEvent.medical_specialty,
    geographicCategory: dbEvent.geographic_category,
    eventDates: dbEvent.event_dates,
    mode: dbEvent.mode,
    keyTopics: dbEvent.key_topics,
    whyAttend: dbEvent.why_attend,
    importantDeadlines: dbEvent.important_deadlines,
    cmeAccreditation: dbEvent.cme_accreditation,
    registrationStatus: dbEvent.registration_status,
    officialWebsite: dbEvent.official_website,
    seoMetadata: dbEvent.seo_metadata,
    galleryUrls: dbEvent.gallery_urls,
    brochureUrl: dbEvent.brochure_url,
  } as ScientificEvent;
};

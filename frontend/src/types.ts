/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum EvidenceLevel {
  SYSTEMATIC_REVIEW = "Systematic Review",
  META_ANALYSIS = "Meta-Analysis",
  RCT = "Randomized Controlled Trial",
  CLINICAL_GUIDELINE = "Clinical Guideline",
  REGULATORY_APPROVAL = "Regulatory Approval",
  GOVERNMENT_NOTIFICATION = "Government Notification",
  OBSERVATIONAL_STUDY = "Observational Study",
  PREPRINT = "Preprint",
  CASE_REPORT = "Case Report",
  EXPERT_OPINION = "Expert Opinion",
  PRESS_RELEASE = "Press Release"
}

export enum Region {
  GLOBAL = "Global",
  INDIA = "India",
  US_EU = "US & Europe"
}

export enum ImpactSeverity {
  INFORMATIONAL = "Informational",
  MONITOR = "Monitor",
  ACTION_REQUIRED = "Action Required",
  URGENT = "Urgent",
  CRITICAL = "Critical"
}

export interface Source {
  id: string;
  name: string;
  url: string;
  reliability: number; // 1 to 5 stars
  trustTier: string; // High, Medium, Low
}

export interface ImpactScores {
  clinicalPractice: number; // 1-5
  medicalEducation: number; // 1-5
  research: number; // 1-5
  publicHealth: number; // 1-5
  hospitalOperations: number; // 1-5
  patientCare: number; // 1-5
}

export interface WhyThisMatters {
  clinicians: string;
  students: string;
  hospitalAdministrators: string;
  patients: string;
  researchers: string;
}

export interface WhatChanged {
  previous: string;
  current: string;
  reason: string;
  strength: string; // Strong, Moderate, Weak
  deadline?: string;
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  cognitiveLevel: string; // Remember, Understand, Apply, Analyze
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
}

export interface VivaQuestion {
  id: string;
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

export interface LearningModule {
  mcqs: MCQ[];
  flashcards: Flashcard[];
  vivaQuestions: VivaQuestion[];
  oneMinuteRevision: string;
}

export interface FactCheckClaim {
  id: string;
  claim: string;
  status: "Supported" | "Partially supported" | "Uncertain" | "Contradicted" | "Unable to verify";
  reference: string;
}

export interface Article {
  id: string;
  slug: string;
  headline: string;
  subhead: string;
  category: string; // Clinical, Research, Pharma, Health Tech, Policy, Education
  specialties: string[];
  region: Region;
  imageUrl: string;
  imageCredit: string;
  imageType: string;
  publishedAt: string; // ISO string
  sourcePublishedAt: string; // ISO string
  readingTimeMinutes: number;
  status: "published" | "draft" | "ingested" | "archived";
  sourceName: string;
  sourceUrl: string;
  isEditorial?: boolean;
  evidenceLevel: EvidenceLevel;
  isAiAssisted: boolean;
  summary30s: string;
  summary2min: string;
  bodyAnalysis: string; // Markdown formatted
  whyThisMatters: WhyThisMatters;
  whatChanged?: WhatChanged;
  impactScores: ImpactScores;
  indiaRelevance: {
    status: "Directly applicable" | "Partially applicable" | "Requires local adaptation" | "Not currently applicable" | "Indian guidance awaited";
    explanation: string;
  };
  peerReviewed: boolean;
  fundingSource: string;
  coiNote: string;
  studyDesign?: string;
  sampleSize?: string;
  references: string[];
  learningModule?: LearningModule;
  factCheckClaims?: FactCheckClaim[];
  clinicalImpactScore?: number;
  views: number;
  author_name?: string;
  author_qualifications?: string;
  author_title?: string;
}

export interface LivingGuideline {
  id: string;
  condition: string; // Diabetes, Hypertension, Tuberculosis, Sepsis, Asthma, COPD, etc.
  issuingOrganization: string; // WHO, ICMR, CDSCO, ADA, ESC, etc.
  currentRecommendation: string;
  previousRecommendation?: string;
  lastUpdated: string;
  reasonForChange: string;
  indiaRelevance: string;
  references: string[];
}

export interface HospitalAlert {
  id: string;
  headline: string;
  severity: ImpactSeverity;
  urgency: "Routine" | "Immediate" | "Critical";
  departmentsAffected: string[];
  recommendedAction: string;
  source: string;
  date: string;
}

export interface CorrectionReport {
  id: string;
  articleId: string;
  articleHeadline: string;
  reportedBy: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
}

export interface NewsletterSubscriber {
  email: string;
  specialty: string;
  frequency: "daily" | "weekly";
  createdAt: string;
}

export interface EventSpeaker {
  name: string;
  title: string;
  institution?: string;
  imageUrl?: string;
  bio?: string;
}

export interface ScheduleSession {
  time: string;
  title: string;
  speaker: string;
  hall?: string;
  description?: string;
}

export interface EventFaq {
  question: string;
  answer: string;
}

export interface AiSummaryData {
  executiveSummary: string;
  keyPearls: string[];
  guidelinesDiscussed: string[];
  researchPapers: string[];
  newDrugUpdates: string[];
  practiceChangingEvidence: string[];
}

export interface ScientificEvent {
  id: string;
  title: string;
  organizer: string;
  scope: "Local" | "Nationwide" | "International";
  eventType: string; // e.g., Conference, CME, Workshop, Webinar, Grand Rounds, etc.
  targetProfessions?: string[]; // e.g., MBBS, MD/MS, DM/MCh, Nursing, Dentistry, etc.
  startDate: string;
  endDate: string;
  duration?: string;
  venue: string;
  city: string;
  state?: string;
  country: string;
  institution?: string;
  format: "In-Person" | "Online" | "Hybrid";
  specialties: string[];
  cmeCredits: number;
  cmeAccreditationBody?: string;
  description: string;
  objectives?: string[];
  abstractDeadline?: string;
  registrationDeadline?: string;
  earlyBirdDeadline?: string;
  earlyBirdCost?: string;
  cost: string;
  seatsAvailable?: number;
  seatsLeft?: number;
  isLive?: boolean;
  status?: "Approved" | "Pending" | "Rejected";
  imageUrl?: string;
  posterUrl?: string;
  keynoteSpeakers?: string[];
  speakerProfiles?: EventSpeaker[];
  schedule?: ScheduleSession[];
  venueMapUrl?: string;
  accommodationNotes?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationUrl: string;
  organizerWebsite?: string;
  faqs?: EventFaq[];
  aiSummary?: AiSummaryData;
  hasDownloadableNotes?: boolean;
  slug?: string;
  submissionUrl?: string;
  certificateUrl?: string;
  souvenirUrl?: string;
  webpageImage?: string;
  viewsCount?: number;
  registrationsCount?: number;
  rating?: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  email: string;
  profession: string;
  specialty: string;
  registrationId: string;
  registrationDate: string;
  cmeClaimed: boolean;
  qrCodeUrl?: string;
  certificateUrl?: string;
}

export interface LiveQnAItem {
  id: string;
  eventId: string;
  userName: string;
  question: string;
  votes: number;
  answered: boolean;
  timestamp: string;
}


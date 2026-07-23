-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMs
CREATE TYPE evidence_level AS ENUM ('Systematic Review', 'Meta-Analysis', 'Randomized Controlled Trial', 'Clinical Guideline', 'Regulatory Approval', 'Government Notification', 'Observational Study', 'Preprint', 'Case Report', 'Expert Opinion', 'Press Release');
CREATE TYPE region_enum AS ENUM ('Global', 'India', 'US & Europe');
CREATE TYPE article_status AS ENUM ('published', 'draft', 'ingested', 'archived');
CREATE TYPE impact_severity AS ENUM ('Informational', 'Monitor', 'Action Required', 'Urgent', 'Critical');
CREATE TYPE urgency_level AS ENUM ('Routine', 'Immediate', 'Critical');
CREATE TYPE correction_status AS ENUM ('pending', 'resolved', 'rejected');
CREATE TYPE newsletter_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE event_scope AS ENUM ('Local', 'Nationwide', 'International');
CREATE TYPE event_format AS ENUM ('In-Person', 'Online', 'Hybrid');
CREATE TYPE event_status AS ENUM ('Approved', 'Pending', 'Rejected');

-- Tables

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    headline TEXT NOT NULL,
    subhead TEXT,
    category TEXT NOT NULL,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    region region_enum NOT NULL,
    image_url TEXT,
    image_credit TEXT,
    image_type TEXT,
    published_at TIMESTAMPTZ,
    source_published_at TIMESTAMPTZ,
    reading_time_minutes INTEGER,
    status article_status NOT NULL DEFAULT 'draft',
    source_name TEXT,
    source_url TEXT,
    evidence_level evidence_level,
    is_ai_assisted BOOLEAN DEFAULT false,
    summary_30s TEXT,
    summary_2min TEXT,
    body_analysis TEXT,
    why_this_matters JSONB, -- stores { clinicians, students, hospitalAdministrators, patients, researchers }
    what_changed JSONB, -- stores { previous, current, reason, strength, deadline }
    impact_scores JSONB, -- stores { clinicalPractice, medicalEducation, research, publicHealth, hospitalOperations, patientCare }
    india_relevance JSONB, -- stores { status, explanation }
    peer_reviewed BOOLEAN DEFAULT false,
    funding_source TEXT,
    coi_note TEXT,
    study_design TEXT,
    sample_size TEXT,
    "references" TEXT[] DEFAULT '{}',
    learning_module JSONB, -- stores mcqs, flashcards, vivaQuestions, oneMinuteRevision
    fact_check_claims JSONB, -- array of claims
    clinical_impact_score NUMERIC,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE living_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    current_recommendation TEXT NOT NULL,
    previous_recommendation TEXT,
    last_updated TIMESTAMPTZ,
    reason_for_change TEXT,
    india_relevance TEXT,
    "references" TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hospital_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline TEXT NOT NULL,
    severity impact_severity NOT NULL,
    urgency urgency_level NOT NULL,
    departments_affected TEXT[] DEFAULT '{}',
    recommended_action TEXT,
    source TEXT,
    date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE correction_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    article_headline TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    description TEXT NOT NULL,
    status correction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    specialty TEXT NOT NULL,
    frequency newsletter_frequency NOT NULL DEFAULT 'weekly',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scientific_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    scope event_scope NOT NULL,
    event_type TEXT NOT NULL,
    target_professions TEXT[] DEFAULT '{}',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration TEXT,
    venue TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    institution TEXT,
    format event_format NOT NULL,
    specialties TEXT[] DEFAULT '{}',
    cme_credits NUMERIC DEFAULT 0,
    cme_accreditation_body TEXT,
    description TEXT NOT NULL,
    objectives TEXT[] DEFAULT '{}',
    abstract_deadline TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    early_bird_deadline TIMESTAMPTZ,
    early_bird_cost TEXT,
    cost TEXT NOT NULL,
    seats_available INTEGER,
    seats_left INTEGER,
    is_live BOOLEAN DEFAULT false,
    status event_status DEFAULT 'Pending',
    image_url TEXT,
    poster_url TEXT,
    keynote_speakers TEXT[] DEFAULT '{}',
    speaker_profiles JSONB,
    schedule JSONB,
    venue_map_url TEXT,
    accommodation_notes TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    registration_url TEXT NOT NULL,
    organizer_website TEXT,
    faqs JSONB,
    ai_summary JSONB,
    has_downloadable_notes BOOLEAN DEFAULT false,
    slug TEXT UNIQUE,
    submission_url TEXT,
    certificate_url TEXT,
    souvenir_url TEXT,
    webpage_image TEXT,
    views_count INTEGER DEFAULT 0,
    registrations_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES scientific_events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    email TEXT NOT NULL,
    profession TEXT NOT NULL,
    specialty TEXT NOT NULL,
    registration_id TEXT UNIQUE NOT NULL,
    registration_date TIMESTAMPTZ NOT NULL,
    cme_claimed BOOLEAN DEFAULT false,
    qr_code_url TEXT,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE live_qna_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES scientific_events(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    question TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    answered BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Configuration
-- Assuming anon role should have read access, and authenticated roles might have more

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on published articles" ON articles FOR SELECT USING (status = 'published');

ALTER TABLE living_guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on living guidelines" ON living_guidelines FOR SELECT USING (true);

ALTER TABLE hospital_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on hospital alerts" ON hospital_alerts FOR SELECT USING (true);

ALTER TABLE scientific_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on scientific events" ON scientific_events FOR SELECT USING (true);

-- Provide anon access to create newsletter subscribers and correction reports
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on newsletter subscribers" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

ALTER TABLE correction_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on correction reports" ON correction_reports FOR INSERT WITH CHECK (true);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on event registrations" ON event_registrations FOR INSERT WITH CHECK (true);

ALTER TABLE live_qna_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert and read on live qna" ON live_qna_items FOR ALL USING (true);

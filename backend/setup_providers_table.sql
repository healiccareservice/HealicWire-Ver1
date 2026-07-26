-- Drop existing providers table if it exists
DROP TABLE IF EXISTS public.providers CASCADE;

-- Create providers table to hold provider news
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  headline VARCHAR(255) NOT NULL,
  subhead TEXT,
  category VARCHAR(50) NOT NULL,
  specialties TEXT[],
  region VARCHAR(50),
  image_url VARCHAR(255),
  image_credit VARCHAR(255),
  image_type VARCHAR(50),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source_published_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'published',
  source_name VARCHAR(255),
  source_url VARCHAR(255),
  is_editorial BOOLEAN DEFAULT FALSE,
  evidence_level VARCHAR(50),
  is_ai_assisted BOOLEAN DEFAULT FALSE,
  summary_30s TEXT,
  summary_2min TEXT,
  body_analysis TEXT,
  why_this_matters JSONB,
  what_changed JSONB,
  impact_scores JSONB,
  india_relevance JSONB,
  peer_reviewed BOOLEAN DEFAULT FALSE,
  funding_source VARCHAR(255),
  coi_note TEXT,
  study_design VARCHAR(255),
  sample_size VARCHAR(100),
  learning_module JSONB,
  fact_check_claims JSONB,
  clinical_impact_score INTEGER,
  views INTEGER DEFAULT 0,
  author_name VARCHAR(255),
  author_qualifications VARCHAR(255),
  author_title VARCHAR(255),
  seo_description TEXT,
  keywords TEXT[],
  provider_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on providers" ON public.providers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on providers" ON public.providers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on providers" ON public.providers FOR DELETE USING (auth.role() = 'authenticated');

-- Explicit Grants (Required for proper role-based access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO anon, authenticated, service_role;

-- Insert the data from articles where category is 'Providers'
INSERT INTO public.providers (
  slug, headline, subhead, category, specialties, region, image_url, image_credit, image_type, 
  published_at, source_published_at, reading_time_minutes, status, source_name, source_url,
  evidence_level, is_ai_assisted, summary_30s, summary_2min, body_analysis, why_this_matters,
  impact_scores, india_relevance, peer_reviewed, funding_source, coi_note, study_design, sample_size,
  views, seo_description, keywords
)
SELECT 
  slug, headline, subhead, category, specialties, region, image_url, image_credit, image_type, 
  published_at, source_published_at, reading_time_minutes, status, source_name, source_url,
  evidence_level, is_ai_assisted, summary_30s, summary_2min, body_analysis, why_this_matters,
  impact_scores, india_relevance, peer_reviewed, funding_source, coi_note, study_design, sample_size,
  views, seo_description, keywords
FROM public.articles 
WHERE category = 'Providers';

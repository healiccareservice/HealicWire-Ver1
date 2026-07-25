CREATE TABLE IF NOT EXISTS public.editorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL,
    headline TEXT NOT NULL,
    subhead TEXT,
    category TEXT,
    specialties JSONB DEFAULT '[]'::jsonb,
    region TEXT,
    image_url TEXT,
    image_credit TEXT,
    published_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft',
    author_name TEXT,
    reading_time_minutes INTEGER DEFAULT 5,
    summary_30s TEXT,
    body_analysis TEXT,
    clinical_impact_score INTEGER DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read access
ALTER TABLE public.editorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published editorials"
    ON public.editorials FOR SELECT
    USING (status = 'published');

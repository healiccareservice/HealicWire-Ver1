-- HealicWire Initial Schema & RLS Policies

-- Create tables for application data
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    headline TEXT NOT NULL,
    subhead TEXT,
    category TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'draft',
    raw_data JSONB
);

CREATE TABLE IF NOT EXISTS public.hospital_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    headline TEXT NOT NULL,
    urgency TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB
);

CREATE TABLE IF NOT EXISTS public.scientific_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    raw_data JSONB
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scientific_events ENABLE ROW LEVEL SECURITY;

-- Grant permissions explicitly
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;

-- Policies for Articles
CREATE POLICY "Allow public read access to published articles"
    ON public.articles FOR SELECT
    TO anon
    USING (status = 'published');

CREATE POLICY "Allow admin full access to articles"
    ON public.articles FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated');

-- Policies for Hospital Alerts
CREATE POLICY "Allow public read access to active alerts"
    ON public.hospital_alerts FOR SELECT
    TO anon
    USING (status = 'active');

CREATE POLICY "Allow admin full access to alerts"
    ON public.hospital_alerts FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated');

-- Policies for Scientific Events
CREATE POLICY "Allow public read access to events"
    ON public.scientific_events FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow admin full access to events"
    ON public.scientific_events FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated');

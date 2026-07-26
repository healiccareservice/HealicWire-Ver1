CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(100) NOT NULL, -- e.g., Corporate Hospital, Clinic, Medical College, NGO
  region VARCHAR(100),
  location VARCHAR(255),
  established_year INTEGER,
  website_url VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  bed_capacity INTEGER,
  accreditations TEXT[], -- e.g., ['NABH', 'JCI']
  services_offered TEXT[],
  description TEXT,
  logo_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: In a real-world scenario you would also want RLS policies on this table, e.g.:
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.providers FOR SELECT USING (true);

-- Adding SEO and provider linking fields to existing articles table (if not already present via migrations)
DO $$ 
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='articles' and column_name='provider_id') THEN
    ALTER TABLE public.articles ADD COLUMN provider_id UUID REFERENCES public.providers(id);
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='articles' and column_name='seo_description') THEN
    ALTER TABLE public.articles ADD COLUMN seo_description TEXT;
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='articles' and column_name='keywords') THEN
    ALTER TABLE public.articles ADD COLUMN keywords TEXT[];
  END IF;
END $$;

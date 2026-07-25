ALTER TABLE clinical_insights 
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_qualifications TEXT,
ADD COLUMN IF NOT EXISTS author_title TEXT;

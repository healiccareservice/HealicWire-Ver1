-- Drop existing repository table if it exists
DROP TABLE IF EXISTS public.repository CASCADE;

-- Create repository table to hold public repository items and images
CREATE TABLE public.repository (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  logo VARCHAR(1024),
  product_name VARCHAR(255),
  details TEXT,
  promotion_image VARCHAR(1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.repository ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public read access so anyone can view the repository items
CREATE POLICY "Allow public read access on repository" 
  ON public.repository FOR SELECT 
  USING (true);

-- Allow authenticated users to insert new repository items
CREATE POLICY "Allow authenticated insert on repository" 
  ON public.repository FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update repository items
CREATE POLICY "Allow authenticated update on repository" 
  ON public.repository FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete repository items
CREATE POLICY "Allow authenticated delete on repository" 
  ON public.repository FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Explicit Grants (Required for proper role-based access in Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repository TO anon, authenticated, service_role;

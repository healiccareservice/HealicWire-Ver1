-- Supabase Security Changes: Add explicit GRANT statements, enable RLS, add proper policies

-- 1. Enable RLS on all newly created tables
ALTER TABLE IF EXISTS scientific_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS generated_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS corrections ENABLE ROW LEVEL SECURITY;

-- 2. Add explicit GRANT statements for public and authenticated access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Add proper policies
-- Public Read Policies (Allow frontend to fetch catalog)
CREATE POLICY "Allow public read access on scientific_events" ON scientific_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access on event_assets" ON event_assets FOR SELECT USING (true);
CREATE POLICY "Allow public read access on uploaded_images" ON uploaded_images FOR SELECT USING (true);
CREATE POLICY "Allow public read access on clinical_insights" ON clinical_insights FOR SELECT USING (true);
CREATE POLICY "Allow public read access on generated_weeks" ON generated_weeks FOR SELECT USING (true);
CREATE POLICY "Allow public read access on corrections" ON corrections FOR SELECT USING (true);

-- Admin Write Policies (Restrict insert, update, delete to authenticated users or service role)
-- Supabase service_role bypasses RLS automatically, but for authenticated admins we add this:
CREATE POLICY "Allow authenticated insert on scientific_events" ON scientific_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on scientific_events" ON scientific_events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on scientific_events" ON scientific_events FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on event_assets" ON event_assets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on event_assets" ON event_assets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on event_assets" ON event_assets FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on uploaded_images" ON uploaded_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on uploaded_images" ON uploaded_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on uploaded_images" ON uploaded_images FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on clinical_insights" ON clinical_insights FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on clinical_insights" ON clinical_insights FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on clinical_insights" ON clinical_insights FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on generated_weeks" ON generated_weeks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on generated_weeks" ON generated_weeks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on generated_weeks" ON generated_weeks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on corrections" ON corrections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on corrections" ON corrections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on corrections" ON corrections FOR DELETE USING (auth.role() = 'authenticated');

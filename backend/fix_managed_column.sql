-- 1. Add the 'managed' column if you haven't already
ALTER TABLE public.scientific_events 
ADD COLUMN IF NOT EXISTS managed text DEFAULT 'Not Managed';

-- 2. Set the default value of the column to 'Not Managed'
ALTER TABLE public.scientific_events 
ALTER COLUMN managed SET DEFAULT 'Not Managed';

-- 3. Fix existing auto-generated events to be 'Not Managed'
UPDATE public.scientific_events
SET managed = 'Not Managed'
WHERE organizer = 'HealicWire Special Page Engine' 
   OR organizer = 'HealicWire Academic Directorate';

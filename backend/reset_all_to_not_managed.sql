-- Set EVERY existing event to 'Not Managed' so they drop down to the standard list
UPDATE public.scientific_events
SET managed = 'Not Managed';

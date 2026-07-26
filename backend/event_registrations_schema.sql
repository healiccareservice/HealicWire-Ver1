CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL, -- Foreign key to the scientific event (e.g., articles table where it's an event)
    
    -- Basic Info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    
    -- Professional Info
    specialty VARCHAR(100),
    designation VARCHAR(100), -- e.g., Consultant, Resident, HOD, Professor
    institution_name VARCHAR(255),
    medical_council_reg_number VARCHAR(100), -- Crucial for CME credit allocation in many countries
    medical_council_name VARCHAR(150), -- E.g., State Medical Council, NMC, GMC
    
    -- Location
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    
    -- Event specific data
    registration_type VARCHAR(50) DEFAULT 'Delegate', -- Delegate, Faculty, Student, Sponsor, etc.
    registration_status VARCHAR(50) DEFAULT 'Registered', -- Registered, Attended, Cancelled
    
    -- CME & Certificate
    cme_credits_awarded DECIMAL(5,2) DEFAULT 0.00,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(1024),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for quick lookup
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);
CREATE INDEX idx_event_registrations_med_council_reg ON event_registrations(medical_council_reg_number);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on event_registrations" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read on event_registrations" ON public.event_registrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on event_registrations" ON public.event_registrations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on event_registrations" ON public.event_registrations FOR DELETE USING (auth.role() = 'authenticated');

-- Explicit Grants (Required for proper role-based access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO anon, authenticated, service_role;

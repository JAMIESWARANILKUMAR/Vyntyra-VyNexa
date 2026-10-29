-- ═══════════════════════════════════════════════════════════════════════════════
-- Vyntyra Institutional Relations Associate (Campus Ambassador Program) Schema
-- Table: public.ambassador_applications
-- Description: Stores candidate applications, college info, drive pitch link,
--              white-background portrait, 6-month agreement acceptance & status.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
    id TEXT PRIMARY KEY, -- e.g. 'VCS-IRA-2026-XXXX' or UUID
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL, -- WhatsApp / phone number
    full_address TEXT NOT NULL, -- Door No, Street, Locality & Pincode for welcome kit courier
    
    -- Institution & Geographic Data
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    college_name TEXT NOT NULL,
    college_location TEXT NOT NULL,
    
    -- Academic Profile
    branch TEXT NOT NULL,
    department TEXT NOT NULL,
    expected_graduation_year TEXT NOT NULL,
    languages_known TEXT[] NOT NULL DEFAULT '{"English"}',
    
    -- Pitch & Media Submissions (Mandatory)
    video_pitch_url TEXT NOT NULL, -- Public Google Drive Link only
    portrait_photo_url TEXT NOT NULL, -- Professional Portrait with white background
    
    -- Social & Web Profiles (Optional)
    linkedin_url TEXT,
    instagram_url TEXT,
    
    -- Statutory 6-Month Agreement & Terms Acceptance
    agreement_accepted BOOLEAN NOT NULL DEFAULT true, -- 6-month tenure agreement acknowledged
    terms_accepted BOOLEAN NOT NULL DEFAULT true, -- Terms and conditions accepted
    
    -- Administrative Review & Workflow Lifecycle
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'enrolled', 'rejected')),
    cohort_name TEXT NOT NULL DEFAULT 'First Cohort 2026-27',
    review_notes TEXT,
    shortlisted_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ,
    agreement_document_url TEXT, -- Sent after shortlisting
    agreement_signed_at TIMESTAMPTZ,
    
    -- Notification Telemetry
    applicant_email_confirmed BOOLEAN NOT NULL DEFAULT true,
    admin_notified BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance & Search Indices
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_email ON public.ambassador_applications(lower(email));
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_phone ON public.ambassador_applications(phone);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_college ON public.ambassador_applications(college_name);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_state_district ON public.ambassador_applications(state, district);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_status ON public.ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_created_at ON public.ambassador_applications(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Anonymous and public candidates can submit applications
DROP POLICY IF EXISTS "Public candidates can submit ambassador application" ON public.ambassador_applications;
CREATE POLICY "Public candidates can submit ambassador application"
    ON public.ambassador_applications FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        video_pitch_url ~* '^https?://(drive\.google\.com|docs\.google\.com)/.+'
        AND agreement_accepted = true
        AND terms_accepted = true
    );

-- Applicants can view their own application via email match
DROP POLICY IF EXISTS "Applicants can view own ambassador application" ON public.ambassador_applications;
CREATE POLICY "Applicants can view own ambassador application"
    ON public.ambassador_applications FOR SELECT
    TO authenticated
    USING (
        email = auth.jwt() ->> 'email'
        OR auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    );

-- Admins and Service Role have full control
DROP POLICY IF EXISTS "Admins have full access to ambassador applications" ON public.ambassador_applications;
CREATE POLICY "Admins have full access to ambassador applications"
    ON public.ambassador_applications FOR ALL
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- 4. Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.update_ambassador_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ambassador_applications_updated_at ON public.ambassador_applications;
CREATE TRIGGER trg_ambassador_applications_updated_at
    BEFORE UPDATE ON public.ambassador_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ambassador_applications_updated_at();

-- 5. Storage Bucket Permissions for Ambassador Portraits
-- Ensures public uploads to 'ambassador-portraits/' in bucket 'default'
INSERT INTO storage.buckets (id, name, public)
VALUES ('default', 'default', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy for anyone to upload portrait images to ambassador-portraits/
DROP POLICY IF EXISTS "Public can upload ambassador portraits" ON storage.objects;
CREATE POLICY "Public can upload ambassador portraits"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        bucket_id = 'default' 
        AND (storage.foldername(name))[1] = 'ambassador-portraits'
    );

-- Policy for anyone to read public ambassador portraits
DROP POLICY IF EXISTS "Public can view ambassador portraits" ON storage.objects;
CREATE POLICY "Public can view ambassador portraits"
    ON storage.objects FOR SELECT
    TO anon, authenticated, public
    USING (
        bucket_id = 'default'
        AND (storage.foldername(name))[1] = 'ambassador-portraits'
    );

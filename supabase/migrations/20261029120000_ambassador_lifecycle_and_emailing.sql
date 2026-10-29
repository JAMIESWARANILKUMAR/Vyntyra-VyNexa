-- ═══════════════════════════════════════════════════════════════════════════════
-- Vyntyra Campus Ambassador Lifecycle & Automated Emailing Schema
-- Table: public.ambassador_applications (Updated with Review & Selection Lifecycle)
-- Table: public.ambassador_email_templates (Configurable Automated Status Emails)
-- Table: public.ambassador_application_logs (Lifecycle Audit Logs)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure Table public.ambassador_applications exists with full lifecycle fields
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    full_address TEXT NOT NULL,
    
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    college_name TEXT NOT NULL,
    college_location TEXT NOT NULL,
    
    branch TEXT NOT NULL,
    department TEXT NOT NULL,
    expected_graduation_year TEXT NOT NULL,
    languages_known TEXT[] NOT NULL DEFAULT '{"English"}',
    
    video_pitch_url TEXT NOT NULL,
    portrait_photo_url TEXT NOT NULL,
    linkedin_url TEXT,
    instagram_url TEXT,
    
    agreement_accepted BOOLEAN NOT NULL DEFAULT true,
    terms_accepted BOOLEAN NOT NULL DEFAULT true,
    
    -- Status Lifecycle: under_review | shortlisted | selected | accepted | agreement_sent | enrolled | rejected
    status TEXT NOT NULL DEFAULT 'under_review' 
        CHECK (status IN ('pending', 'under_review', 'shortlisted', 'selected', 'accepted', 'agreement_sent', 'enrolled', 'rejected')),
    cohort_name TEXT NOT NULL DEFAULT 'First Cohort 2026-27',
    
    -- Review Notes & Lifecycle Timestamps
    review_notes TEXT,
    reviewed_by TEXT,
    under_review_at TIMESTAMPTZ DEFAULT now(),
    shortlisted_at TIMESTAMPTZ,
    selected_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    agreement_document_url TEXT,
    agreement_sent_at TIMESTAMPTZ,
    agreement_signed_at TIMESTAMPTZ,
    
    applicant_email_confirmed BOOLEAN NOT NULL DEFAULT true,
    admin_notified BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add any missing columns to existing table if it already existed
DO $$
BEGIN
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS review_notes TEXT;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS under_review_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMPTZ;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS selected_at TIMESTAMPTZ;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS agreement_document_url TEXT;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ;
    ALTER TABLE public.ambassador_applications ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 2. Automated Email Templates Table (Configurable inside Super Admin Operations)
CREATE TABLE IF NOT EXISTS public.ambassador_email_templates (
    id TEXT PRIMARY KEY,
    status_trigger TEXT NOT NULL UNIQUE, -- 'under_review' | 'shortlisted' | 'selected' | 'agreement_sent' | 'rejected'
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    sender_name TEXT NOT NULL DEFAULT 'Vyntyra Institutional Relations Cell',
    sender_email TEXT NOT NULL DEFAULT 'ambassadorprogram@vyntyraconsultancyservices.in',
    agreement_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Application Lifecycle Audit Logs Table
CREATE TABLE IF NOT EXISTS public.ambassador_application_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id TEXT NOT NULL REFERENCES public.ambassador_applications(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    notes TEXT,
    email_dispatched BOOLEAN DEFAULT false,
    email_provider TEXT,
    email_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indices for Performance
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_status ON public.ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_email ON public.ambassador_applications(lower(email));
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_college ON public.ambassador_applications(college_name);
CREATE INDEX IF NOT EXISTS idx_ambassador_email_templates_trigger ON public.ambassador_email_templates(status_trigger);
CREATE INDEX IF NOT EXISTS idx_ambassador_app_logs_app_id ON public.ambassador_application_logs(application_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_application_logs ENABLE ROW LEVEL SECURITY;

-- Admins and Service Role have full control
DROP POLICY IF EXISTS "Admins have full access to ambassador email templates" ON public.ambassador_email_templates;
CREATE POLICY "Admins have full access to ambassador email templates"
    ON public.ambassador_email_templates FOR ALL
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins have full access to ambassador logs" ON public.ambassador_application_logs;
CREATE POLICY "Admins have full access to ambassador logs"
    ON public.ambassador_application_logs FOR ALL
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- 6. Pre-seed Default Automated Email Templates
INSERT INTO public.ambassador_email_templates (id, status_trigger, title, subject, body_html, agreement_url, is_enabled)
VALUES
(
    'tmpl_under_review',
    'under_review',
    'Application Under Review Notification',
    '🔍 Application Under Review: Vyntyra Institutional Relations Associate (Cohort 1.0)',
    '<p>Dear <strong>{{full_name}}</strong>,</p><p>Your application for <strong>Vyntyra Institutional Relations Associate (Campus Ambassador)</strong> representing <strong>{{college_name}}</strong> is officially <strong>under committee review</strong>.</p><p>Our selection panel is currently reviewing your profile credentials and your 5-10 minute video pitch.</p><p>We will notify you shortly regarding candidate shortlisting and interview rounds.</p><p>Best regards,<br/><strong>Vyntyra Institutional Relations Committee</strong></p>',
    NULL,
    true
),
(
    'tmpl_shortlisted',
    'shortlisted',
    'Candidate Shortlisted Notification',
    '🎉 Congratulations! You are Shortlisted for Vyntyra Institutional Relations Associate',
    '<p>Dear <strong>{{full_name}}</strong>,</p><p>We are delighted to inform you that you have been <strong>Shortlisted</strong> for the <strong>First Cohort 2026-27</strong> of the Vyntyra Institutional Relations Associate Program representing <strong>{{college_name}}</strong>!</p><p>Your video pitch and academic track record demonstrated exemplary leadership potential.</p><p><strong>Next Steps:</strong> You will receive an interview slot invitation and identity verification schedule within the next 48 hours.</p><p>Warm regards,<br/><strong>Vyntyra Campus Leadership Cell</strong></p>',
    NULL,
    true
),
(
    'tmpl_selected',
    'selected',
    'Selection Letter & 6-Month Agreement Dispatched',
    '🏆 Official Selection: Vyntyra Institutional Relations Associate & 6-Month Agreement',
    '<p>Dear <strong>{{full_name}}</strong>,</p><p>Heartiest congratulations! You have been officially <strong>SELECTED</strong> as the <strong>Vyntyra Institutional Relations Associate (Campus Ambassador)</strong> for <strong>{{college_name}}</strong> in Cohort 1.0!</p><p>As outlined in our program terms, your appointment is for a <strong>formal 6-month tenure</strong>.</p><p><strong>Action Required - 6-Month Agreement:</strong><br/>Please download, review, and digitally sign your official <strong>6-Month Association Agreement Document</strong> using the link below:</p><p><a href="{{agreement_link}}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0b1120;font-weight:bold;text-decoration:none;border-radius:6px;">Review & Sign 6-Month Agreement &rarr;</a></p><p>Upon signature, your personalized Executive IRA Welcome Kit & ID Badge will be dispatched to your address.</p><p>Warm congratulations,<br/><strong>Board of Directors · Vyntyra Consultancy Services Pvt. Ltd.</strong></p>',
    'https://vyntyraconsultancyservices.in/campus-ambassador/agreement-sample.pdf',
    true
),
(
    'tmpl_agreement_sent',
    'agreement_sent',
    'Welcome Kit & Community Onboarding Notice',
    '🚀 Welcome Onboard! Official Onboarding & Welcome Kit Dispatch — Vyntyra IRA',
    '<p>Dear <strong>{{full_name}}</strong>,</p><p>Your 6-month agreement has been recorded. You are officially an active <strong>Institutional Relations Associate</strong> representing Vyntyra at <strong>{{college_name}}</strong>!</p><p>📦 <strong>Welcome Kit Status:</strong> Packed & assigned for courier dispatch.<br/>💼 <strong>Rewards Portal:</strong> Milestone stipends up to ₹15,000 are now active.<br/>📲 <strong>Ambassador Community:</strong> You will be added to the private Cohort 1.0 Executive Slack & WhatsApp group.</p><p>Welcome to the family!<br/><strong>Vyntyra Corporate Leadership Team</strong></p>',
    NULL,
    true
),
(
    'tmpl_rejected',
    'rejected',
    'Application Status Update (Not Shortlisted)',
    'Update regarding your Vyntyra Campus Ambassador Application (First Cohort)',
    '<p>Dear <strong>{{full_name}}</strong>,</p><p>Thank you very much for your interest and the time you invested in applying for the Vyntyra Institutional Relations Associate First Cohort from <strong>{{college_name}}</strong>.</p><p>Due to exceptional application volumes and strictly limited allocations per institution, we are unable to advance your application for Cohort 1.0 at this time.</p><p>We thoroughly enjoyed reviewing your profile and invite you to participate in upcoming Vyntyra technical hackathons, bootcamps, and future cohort cycles.</p><p>Wishing you the very best in your academic and professional endeavors.<br/><strong>Vyntyra Talent Acquisition & Student Relations</strong></p>',
    NULL,
    true
)
ON CONFLICT (status_trigger) DO UPDATE SET
    title = EXCLUDED.title,
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    agreement_url = COALESCE(EXCLUDED.agreement_url, ambassador_email_templates.agreement_url),
    updated_at = now();

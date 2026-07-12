
-- 1. Status event log
CREATE TABLE public.application_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_status application_status,
  to_status application_status NOT NULL,
  note text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_events_app ON public.application_status_events(application_id, created_at DESC);

GRANT SELECT, INSERT ON public.application_status_events TO authenticated;
GRANT ALL ON public.application_status_events TO service_role;
ALTER TABLE public.application_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view status events"
  ON public.application_status_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert status events"
  ON public.application_status_events FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND changed_by = auth.uid());

-- 2. Editable email templates (one row per status)
CREATE TABLE public.status_email_templates (
  status application_status PRIMARY KEY,
  subject text NOT NULL,
  html_body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE ON public.status_email_templates TO authenticated;
GRANT ALL ON public.status_email_templates TO service_role;
ALTER TABLE public.status_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view templates"
  ON public.status_email_templates FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert templates"
  ON public.status_email_templates FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates"
  ON public.status_email_templates FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tg_status_templates_updated_at
  BEFORE UPDATE ON public.status_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed default templates
INSERT INTO public.status_email_templates (status, subject, html_body) VALUES
('new', 'Application received — Project VyNexa',
'<p>Dear {{full_name}},</p><p>Thank you for applying for <strong>{{role_applied}}</strong>. Your application is now in our queue.</p><p>You can view the latest status of your application at any time using the secure link below.</p><p><a href="{{portal_link}}">Check application status</a></p><p>Warm regards,<br/>The Vyntyra Talent Team</p>'),
('reviewing', 'Your application is under review — {{role_applied}}',
'<p>Dear {{full_name}},</p><p>Good news — our team has started reviewing your application for <strong>{{role_applied}}</strong>. We will get back to you shortly with next steps.</p><p><a href="{{portal_link}}">View status</a></p><p>Warm regards,<br/>The Vyntyra Talent Team</p>'),
('shortlisted', 'You are shortlisted — {{role_applied}}',
'<p>Dear {{full_name}},</p><p>Congratulations! You have been <strong>shortlisted</strong> for <strong>{{role_applied}}</strong>. Our team will reach out shortly to schedule the next round.</p><p><a href="{{portal_link}}">View status</a></p><p>Warm regards,<br/>The Vyntyra Talent Team</p>'),
('rejected', 'Update on your application — {{role_applied}}',
'<p>Dear {{full_name}},</p><p>Thank you for your interest in <strong>{{role_applied}}</strong> at Vyntyra. After careful consideration, we have decided not to move forward with your application at this time.</p><p>We appreciate the time you invested and encourage you to apply for future opportunities that match your profile.</p><p>Warm regards,<br/>The Vyntyra Talent Team</p>'),
('hired', 'Welcome aboard — {{role_applied}}',
'<p>Dear {{full_name}},</p><p>We are delighted to move forward with you for <strong>{{role_applied}}</strong>! Our HR team will contact you shortly with the offer details and onboarding information.</p><p>Warm regards,<br/>The Vyntyra Talent Team</p>');

-- 3. Applicant magic-link tokens (store only SHA-256 hash)
CREATE TABLE public.applicant_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_applicant_tokens_app ON public.applicant_access_tokens(application_id);

-- No authenticated grants: only service_role touches this table.
GRANT ALL ON public.applicant_access_tokens TO service_role;
ALTER TABLE public.applicant_access_tokens ENABLE ROW LEVEL SECURITY;
-- No policies => locked to authenticated/anon; service role bypasses RLS.

-- 4. Transition validation trigger on applications
CREATE OR REPLACE FUNCTION public.tg_validate_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Any status can transition to rejected
  IF NEW.status = 'rejected' THEN
    allowed := true;
  ELSIF OLD.status = 'new' AND NEW.status = 'reviewing' THEN
    allowed := true;
  ELSIF OLD.status = 'reviewing' AND NEW.status = 'shortlisted' THEN
    allowed := true;
  ELSIF OLD.status = 'shortlisted' AND NEW.status = 'hired' THEN
    allowed := true;
  END IF;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_applications_validate_transition
  BEFORE UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_validate_status_transition();

-- Also keep updated_at fresh
CREATE TRIGGER tg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

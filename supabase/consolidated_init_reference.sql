-- Role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role );
$$;

-- 1. job_postings
CREATE TABLE public.job_postings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  department  TEXT        NOT NULL,
  location    TEXT        NOT NULL DEFAULT 'Remote',
  type        TEXT        NOT NULL DEFAULT 'Full-time',
  description TEXT        NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active job postings" ON public.job_postings FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can insert job postings" ON public.job_postings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update job postings" ON public.job_postings FOR UPDATE TO authenticated USING  (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete job postings" ON public.job_postings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

-- Applications table
CREATE TYPE public.application_status AS ENUM ('new', 'reviewing', 'shortlisted', 'rejected', 'hired');

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role_applied TEXT NOT NULL,
  message TEXT,
  company TEXT,
  position TEXT,
  linkedin_url TEXT,
  years_experience TEXT,
  portfolio_url TEXT,
  availability TEXT,
  resume_path TEXT,
  agreement_accepted BOOLEAN NOT NULL DEFAULT false,
  agreement_version TEXT NOT NULL DEFAULT 'v1.0',
  status application_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  interview_questions text, 
  interview_questions_generated_at timestamptz,
  state text,
  college text,
  graduation_year integer CHECK (graduation_year IS NULL OR (graduation_year BETWEEN 2022 AND 2035)),
  hod_name text,
  hod_contact text,
  hod_email text,
  tp_officer_name text,
  tp_officer_contact text,
  tp_officer_email text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an application"
ON public.applications FOR INSERT TO anon, authenticated
WITH CHECK (agreement_accepted = true);

CREATE POLICY "Admins can view all applications"
ON public.applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
ON public.applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete applications"
ON public.applications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

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

CREATE POLICY "Admins can view status events" ON public.application_status_events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert status events" ON public.application_status_events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND changed_by = auth.uid());

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

CREATE POLICY "Admins can view templates" ON public.status_email_templates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert templates" ON public.status_email_templates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update templates" ON public.status_email_templates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tg_status_templates_updated_at BEFORE UPDATE ON public.status_email_templates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed default templates
INSERT INTO public.status_email_templates (status, subject, html_body) VALUES
('new', 'Application received — Project VyNexa', '<p>Dear {{full_name}},</p><p>Thank you for applying for <strong>{{role_applied}}</strong>.</p>'),
('reviewing', 'Your application is under review', '<p>Dear {{full_name}},</p><p>Good news — our team has started reviewing your application.</p>'),
('shortlisted', 'You are shortlisted', '<p>Dear {{full_name}},</p><p>Congratulations! You have been shortlisted.</p>'),
('rejected', 'Update on your application', '<p>Dear {{full_name}},</p><p>Thank you for your interest. We have decided not to move forward.</p>'),
('hired', 'Welcome aboard', '<p>Dear {{full_name}},</p><p>We are delighted to move forward with you!</p>');

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
GRANT ALL ON public.applicant_access_tokens TO service_role;
ALTER TABLE public.applicant_access_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Transition validation trigger on applications
CREATE OR REPLACE FUNCTION public.tg_validate_status_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE allowed boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'rejected' THEN allowed := true;
  ELSIF OLD.status = 'new' AND NEW.status = 'reviewing' THEN allowed := true;
  ELSIF OLD.status = 'reviewing' AND NEW.status = 'shortlisted' THEN allowed := true;
  ELSIF OLD.status = 'shortlisted' AND NEW.status = 'hired' THEN allowed := true; END IF;
  IF NOT allowed THEN RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status USING ERRCODE = 'check_violation'; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_applications_validate_transition BEFORE UPDATE OF status ON public.applications FOR EACH ROW EXECUTE FUNCTION public.tg_validate_status_transition();

-- application projects
CREATE TABLE IF NOT EXISTS public.application_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  project_url text,
  document_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_projects TO authenticated;
GRANT INSERT ON public.application_projects TO anon;
GRANT ALL ON public.application_projects TO service_role;
ALTER TABLE public.application_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add projects during submission" ON public.application_projects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view all projects" ON public.application_projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update projects" ON public.application_projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete projects" ON public.application_projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS application_projects_application_id_idx ON public.application_projects(application_id);

-- site settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES ('applications_open', '{"enabled": true}'::jsonb) ON CONFLICT (key) DO NOTHING;

-- admin notifications
CREATE TABLE public.admin_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  metadata   JSONB       DEFAULT '{}',
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING  (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert notifications" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications (created_at DESC);

-- visitor counts
CREATE TABLE public.visitor_counts (
  page_key   TEXT        PRIMARY KEY,
  count      BIGINT      NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.visitor_counts TO anon, authenticated;
GRANT ALL ON public.visitor_counts TO service_role;
ALTER TABLE public.visitor_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visitor counts" ON public.visitor_counts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can upsert visitor counts" ON public.visitor_counts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update visitor counts" ON public.visitor_counts FOR UPDATE TO anon, authenticated USING (true);

INSERT INTO public.visitor_counts (page_key, count) VALUES ('home', 0) ON CONFLICT DO NOTHING;

-- Storage setup
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('projects', 'projects', false) on conflict do nothing;

CREATE POLICY "Anyone can upload a resume" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Admins can read resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can upload a project" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'projects');
CREATE POLICY "Admins can read projects" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'projects' AND public.has_role(auth.uid(), 'admin'));

-- admin grant trigger
CREATE OR REPLACE FUNCTION public.tg_auto_grant_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Grant admin to authorized emails
  IF NEW.email = 'hr@vyntyraconsultancyservices.in' OR NEW.email = 'admin@vyntyraconsultancyservices.in' OR NEW.email = 'jamianil37@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER auto_grant_admin_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.tg_auto_grant_admin();

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

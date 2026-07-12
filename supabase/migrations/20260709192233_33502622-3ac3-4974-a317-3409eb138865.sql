ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS college text,
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS hod_name text,
  ADD COLUMN IF NOT EXISTS hod_contact text,
  ADD COLUMN IF NOT EXISTS hod_email text,
  ADD COLUMN IF NOT EXISTS tp_officer_name text,
  ADD COLUMN IF NOT EXISTS tp_officer_contact text,
  ADD COLUMN IF NOT EXISTS tp_officer_email text;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_graduation_year_check,
  ADD CONSTRAINT applications_graduation_year_check
    CHECK (graduation_year IS NULL OR (graduation_year BETWEEN 2022 AND 2035));

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

CREATE POLICY "Anyone can add projects during submission"
  ON public.application_projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all projects"
  ON public.application_projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects"
  ON public.application_projects FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects"
  ON public.application_projects FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS application_projects_application_id_idx
  ON public.application_projects(application_id);

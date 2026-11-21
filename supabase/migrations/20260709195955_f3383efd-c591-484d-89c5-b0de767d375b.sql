CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  key TEXT,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS key TEXT;

DO $$ BEGIN
  ALTER TABLE public.site_settings ALTER COLUMN id DROP NOT NULL;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.site_settings ALTER COLUMN key DROP NOT NULL;
EXCEPTION WHEN others THEN null; END $$;

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (id, key, value)
VALUES ('applications_open', 'applications_open', '{"enabled": true}'::jsonb)
ON CONFLICT DO NOTHING;

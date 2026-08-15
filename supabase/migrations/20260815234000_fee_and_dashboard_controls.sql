-- Add fee management columns to profiles
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS exam_fee_amount numeric DEFAULT 199,
ADD COLUMN IF NOT EXISTS is_fee_exempted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS exam_fee_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fee_payment_scheduled boolean DEFAULT false;

-- Create global dashboard settings table
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_type text NOT NULL, -- 'intern' or 'employee'
  module_name text NOT NULL, -- e.g., 'lms', 'kanban', 'referrals', 'meetings'
  is_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS for dashboard_settings
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can view dashboard settings"
ON public.dashboard_settings FOR SELECT TO authenticated
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert dashboard settings"
ON public.dashboard_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update dashboard settings"
ON public.dashboard_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete dashboard settings"
ON public.dashboard_settings FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed some default intern modules
INSERT INTO public.dashboard_settings (portal_type, module_name, is_enabled) VALUES
('intern', 'lms', true),
('intern', 'kanban', true),
('intern', 'referrals', true),
('intern', 'meetings', true),
('intern', 'deliverables', true);

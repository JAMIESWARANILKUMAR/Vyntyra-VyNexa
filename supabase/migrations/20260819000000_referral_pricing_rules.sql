-- Create referral pricing rules table
CREATE TABLE IF NOT EXISTS public.referral_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  referrer_name text,
  custom_exam_fee numeric NOT NULL DEFAULT 199,
  discount_amount numeric DEFAULT 0,
  commission_reward numeric DEFAULT 50,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.referral_pricing_rules ENABLE ROW LEVEL SECURITY;

DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_pricing_rules' AND policyname = 'Allow authenticated to view referral pricing rules') THEN
    CREATE POLICY "Allow authenticated to view referral pricing rules"
    ON public.referral_pricing_rules FOR SELECT TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_pricing_rules' AND policyname = 'Allow public read of active referral pricing rules') THEN
    CREATE POLICY "Allow public read of active referral pricing rules"
    ON public.referral_pricing_rules FOR SELECT TO anon
    USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_pricing_rules' AND policyname = 'Allow admins to manage referral pricing rules') THEN
    CREATE POLICY "Allow admins to manage referral pricing rules"
    ON public.referral_pricing_rules FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END \$\$;
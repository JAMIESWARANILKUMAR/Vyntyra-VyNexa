-- Add is_payment_enabled to profiles table
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS is_payment_enabled boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';

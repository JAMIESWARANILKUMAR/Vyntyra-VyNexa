-- Add fee deadline and onscreen popup notification fields to profiles
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS fee_payment_deadline timestamptz,
ADD COLUMN IF NOT EXISTS urgent_popup_title text,
ADD COLUMN IF NOT EXISTS urgent_popup_message text,
ADD COLUMN IF NOT EXISTS urgent_popup_active boolean DEFAULT false;